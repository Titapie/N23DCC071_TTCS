require('dotenv').config();
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('./src/models/user.model');
const Project = require('./src/models/project.model');
const Task = require('./src/models/task.model');
const ProjectMember = require('./src/models/projectMember.model');
const Assignment = require('./src/models/assignment.model');
const { hasRole } = require('./src/middleware/auth.middleware');

// Hàm buildUserContext an toàn
const buildUserContext = async (user) => {
  const userId = user._id;
  const isAdmin = hasRole(user, 'admin');
  const isManager = hasRole(user, 'manager');
  const isEmployee = hasRole(user, 'employee');

  let projects = [];
  let tasks = [];

  try {
    if (isAdmin) {
      const [allProjects, allTasks] = await Promise.all([
        Project.find().lean(),
        Task.find().populate('project', 'name').lean()
      ]);
      
      projects = allProjects.map(p => {
        if (!p || !p._id) return null;
        return {
          id: p._id.toString(),
          name: p.name || 'Không có tên',
          description: p.description || '',
          startDate: p.startDate,
          endDate: p.endDate,
          progress: p.progress || 0,
          userRole: 'admin'
        };
      }).filter(Boolean);

      tasks = allTasks.map(t => {
        if (!t || !t._id) return null;
        return {
          id: t._id.toString(),
          name: t.name || 'Không có tên',
          description: t.description || '',
          status: t.status || 'todo',
          priority: t.priority || 'medium',
          startDate: t.startDate,
          dueDate: t.dueDate,
          projectName: (t.project && t.project.name) ? t.project.name : 'Không có dự án',
          userRole: 'admin'
        };
      }).filter(Boolean);
    } else {
      let managerProjectIds = [];
      let employeeProjectIds = [];
      let employeeAssignedTaskIds = [];

      if (isManager) {
        const myProjects = await Project.find({ createdBy: userId }).select('_id').lean();
        managerProjectIds = myProjects.map(p => p._id ? p._id.toString() : null).filter(Boolean);
      }

      if (isEmployee) {
        const memberships = await ProjectMember.find({ user: userId }).select('project').lean();
        employeeProjectIds = memberships.map(m => m.project ? m.project.toString() : null).filter(Boolean);

        const myAssignments = await Assignment.find({ assignee: userId }).populate({
          path: 'task',
          select: 'project'
        }).lean();

        myAssignments.forEach(a => {
          if (a.task && a.task._id) {
            employeeAssignedTaskIds.push(a.task._id.toString());
            if (a.task.project) {
              employeeProjectIds.push(a.task.project.toString());
            }
          }
        });

        employeeProjectIds = Array.from(new Set(employeeProjectIds));
      }

      const allUniqueProjectIds = Array.from(new Set([...managerProjectIds, ...employeeProjectIds]));
      const dbProjects = await Project.find({ _id: { $in: allUniqueProjectIds } }).lean();

      projects = dbProjects.map(p => {
        if (!p || !p._id) return null;
        const pidStr = p._id.toString();
        const isCreator = managerProjectIds.includes(pidStr);
        const isMember = employeeProjectIds.includes(pidStr);
        
        let userRole = 'employee';
        if (isCreator && isMember) userRole = 'both';
        else if (isCreator) userRole = 'manager';
        
        return {
          id: pidStr,
          name: p.name || 'Không có tên',
          description: p.description || '',
          startDate: p.startDate,
          endDate: p.endDate,
          progress: p.progress || 0,
          userRole
        };
      }).filter(Boolean);

      const taskFilter = {
        $or: [
          { project: { $in: managerProjectIds } },
          { project: { $in: employeeProjectIds } },
          { _id: { $in: employeeAssignedTaskIds } }
        ]
      };

      const dbTasks = await Task.find(taskFilter).populate('project', 'name createdBy').lean();
      const taskIds = dbTasks.map(t => t._id);
      const assignments = await Assignment.find({ task: { $in: taskIds } }).select('task assignee').lean();

      tasks = dbTasks.map(t => {
        if (!t || !t._id) return null;
        const tidStr = t._id.toString();
        const isProjectManager = t.project && t.project._id && managerProjectIds.includes(t.project._id.toString());
        const isAssigned = assignments.some(a => a.task && a.assignee && a.task.toString() === tidStr && a.assignee.toString() === userId.toString());

        let userRole = 'employee';
        if (isProjectManager && isAssigned) userRole = 'both';
        else if (isProjectManager) userRole = 'manager';

        return {
          id: tidStr,
          name: t.name || 'Không có tên',
          description: t.description || '',
          status: t.status || 'todo',
          priority: t.priority || 'medium',
          startDate: t.startDate,
          dueDate: t.dueDate,
          projectName: (t.project && t.project.name) ? t.project.name : 'Không có dự án',
          userRole
        };
      }).filter(Boolean);
    }
  } catch (err) {
    console.error('Error in buildUserContext:', err);
  }

  return {
    currentDate: "2026-05-28T08:00:00+07:00", // Fix thời gian để demo đồng nhất
    currentUser: {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      roles: user.roles && user.roles.length > 0 ? user.roles : [user.role]
    },
    projects,
    tasks
  };
};

const systemPrompt = `
Bạn là Trợ lý AI quản lý công việc thông minh, tích cực và chính xác của hệ thống quản lý công việc AA (xưng hô là "em" và gọi người dùng là "anh/chị").
Nhiệm vụ của bạn là hỗ trợ giải đáp thắc mắc về công việc, dự án, thời hạn và độ ưu tiên dựa trên dữ liệu thật được cung cấp.

QUY TẮC QUAN TRỌNG (HÃY TUÂN THỦ TUYỆT ĐỐI):
1. CHÀO HỎI & GIAO TIẾP XÃ GIAO: Nếu người dùng chỉ chào hỏi (ví dụ: "hi", "hello", "chào em",...), cảm ơn hoặc tạm biệt, hãy trả lời ngắn gọn, lịch sự, giới thiệu bản thân là trợ lý ảo AA và sẵn sàng hỗ trợ. TUYỆT ĐỐI KHÔNG tự động liệt kê hoặc tóm tắt các dự án/công việc trong context ở bước này.
2. GIỚI HẠN NỘI DUNG (OUT-OF-SCOPE): Nếu người dùng hỏi những câu không liên quan đến công việc hoặc dự án quản lý (ví dụ: hỏi thời tiết, nấu ăn, viết code ngoài lề, kiến thức chung...), hãy từ chối lịch sự: "Xin lỗi, em là trợ lý quản lý công việc AA. Em chỉ có thể hỗ trợ các thông tin liên quan đến dự án và công việc trong phạm vi tài khoản của anh/chị."
3. GIỚI HẠN DỮ LIỆU & PHÂN QUYỀN: Bạn CHỈ được trả lời dựa trên thông tin được cung cấp trong phần [Hệ Thống Dữ Liệu Context]. Tuyệt đối không được bịa đặt tên dự án, tên công việc, deadline. Nếu người dùng hỏi về một dự án hoặc công việc không có trong context (hoặc hỏi ngoài quyền hạn), hãy trả lời: "Em không tìm thấy thông tin về dự án hoặc công việc này trong dữ liệu tài khoản của anh/chị. Vui lòng kiểm tra lại tên hoặc quyền truy cập."
4. Định dạng câu trả lời bằng tiếng Việt, ngắn gọn, rõ ràng bằng Markdown (in đậm các điểm mốc quan trọng, sử dụng danh sách gạch đầu dòng).
5. Tham chiếu thời gian hiện tại từ trường currentDate để tính toán chính xác các công việc sắp đến hạn, quá hạn hoặc đúng tiến độ.
6. Nếu người dùng có cả hai vai trò Employee và Manager, hãy tách bạch câu trả lời theo từng vai trò khi họ yêu cầu tóm tắt công việc chung chung.
`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: systemPrompt
});

async function testUser(email) {
  const user = await User.findOne({ email });
  if (!user) {
    console.log(`[DEMO] User with email ${email} not found.`);
    return null;
  }
  
  const context = await buildUserContext(user);
  
  const promptToSend = `
[Hệ Thống Dữ Liệu Context]:
${JSON.stringify(context, null, 2)}

[Tin Nhắn Người Dùng]:
Tóm tắt dự án và công việc của tôi
`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: promptToSend }] }]
  });

  return {
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    roles: context.currentUser.roles,
    contextSummary: {
      projectsCount: context.projects.length,
      tasksCount: context.tasks.length,
      projectsList: context.projects.map(p => `${p.name} (Role: ${p.userRole})`),
      tasksList: context.tasks.map(t => `${t.name} (Project: ${t.projectName}, Status: ${t.status})`)
    },
    aiReply: result.response.text()
  };
}

async function runAllDemos() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.\n");

    const emails = [
      "admin@gmail.com",
      "hung.manager@gmail.com",
      "binh.employee@gmail.com",
      "hoanganh142005@gmail.com"
    ];

    const results = [];
    for (const email of emails) {
      console.log(`Generating demo for ${email}...`);
      const res = await testUser(email);
      if (res) results.push(res);
    }

    console.log("\n=================== DEMO DETAILS GENERATED ===================\n");
    results.forEach(r => {
      console.log(`ROLE: ${r.roles.join(', ').toUpperCase()}`);
      console.log(`USER: ${r.name} (${r.email})`);
      console.log("------------------ CONTEXT DATA SENT TO AI ------------------");
      console.log(JSON.stringify(r.contextSummary, null, 2));
      console.log("------------------ AI RESPONSE ------------------");
      console.log(r.aiReply);
      console.log("\n==============================================================\n");
    });

  } catch (error) {
    console.error("DEMO RUN ERROR:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

runAllDemos();
