import React from 'react';
import {Calendar} from 'lucide-react';
import AdminStats from "../../components/admin/AdminStats.jsx";

const AdminDashboard = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-white dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 p-6 text-gray-900 dark:text-white">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                Admin Dashboard
                            </h1>
                            <p className="text-gray-600 dark:text-slate-400 mt-2 flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                {new Date().toLocaleDateString('vi-VN', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Admin Stats Component - now handles its own refresh */}
                <AdminStats />
            </div>
        </div>
    );
};

export default AdminDashboard;