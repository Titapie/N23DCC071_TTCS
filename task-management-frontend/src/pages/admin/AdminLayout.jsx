import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Menu, X, Sun, Moon, Briefcase, ListTodo } from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import AIChatbox from '../../components/common/AIChatbox';

const AdminLayout = () => {
    const { logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navigation = [
        {
            name: 'Dashboard',
            path: '/admin/dashboard',
            icon: LayoutDashboard
        },
        {
            name: 'Users',
            path: '/admin/users',
            icon: Users
        },
        {
            name: 'Projects',
            path: '/admin/projects',
            icon: Briefcase
        },
        {
            name: 'Tasks',
            path: '/admin/tasks',
            icon: ListTodo
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 bg-white dark:bg-slate-800 shadow-lg border-r dark:border-slate-700 transition-all duration-300 z-30 ${
                sidebarOpen ? 'w-64' : 'w-20'
            }`}>
                <div className="flex flex-col h-full">
                    {/* Logo & Toggle */}
                    <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                        {sidebarOpen ? (
                            <>
                                <div>
                                    <h1 className="text-2xl font-bold text-purple-600 dark:text-purple-400">Admin Page</h1>
                                    <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Quản trị web</p>
                                </div>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-2 bg-transparent dark:bg-transparent hover:bg-purple-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 bg-transparent dark:bg-transparent hover:bg-purple-100 dark:hover:bg-slate-700 rounded-lg transition-colors mx-auto"
                            >
                                <Menu className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </button>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4">
                        <ul className="space-y-2">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;

                                return (
                                    <li key={item.path}>
                                        <NavLink
                                            to={item.path}
                                            className={`flex items-center px-4 py-3 rounded-lg transition-all ${
                                                isActive
                                                    ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-500 border-r-4 border-purple-500'
                                                    : 'text-gray-700 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-slate-700 hover:text-purple-500 dark:hover:text-purple-400'
                                            }`}
                                            title={!sidebarOpen ? item.name : ''}
                                        >
                                            <Icon className={`w-5 h-5 ${sidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                                            {sidebarOpen && (
                                                <span className="font-medium">{item.name}</span>
                                            )}
                                        </NavLink>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* Theme toggle & Logout button */}
                    <div className="p-4 border-t border-gray-200 dark:border-slate-700 space-y-2">
                        <button
                            onClick={toggleTheme}
                            className={`flex items-center w-full px-4 py-3 bg-transparent dark:bg-transparent text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors ${
                                !sidebarOpen && 'justify-center'
                            }`}
                            title={theme === 'dark' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
                        >
                            {theme === 'dark' ? (
                                <Sun className={`w-5 h-5 text-amber-500 ${sidebarOpen ? 'mr-3' : ''}`} />
                            ) : (
                                <Moon className={`w-5 h-5 text-indigo-500 ${sidebarOpen ? 'mr-3' : ''}`} />
                            )}
                            {sidebarOpen && (
                                <span className="font-medium">
                                    {theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={handleLogout}
                            className={`flex items-center w-full px-4 py-3 bg-transparent dark:bg-transparent text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors ${
                                !sidebarOpen && 'justify-center'
                            }`}
                            title={!sidebarOpen ? 'Đăng xuất' : ''}
                        >
                            <LogOut className={`w-5 h-5 ${sidebarOpen ? 'mr-3' : ''}`} />
                            {sidebarOpen && <span className="font-medium">Đăng xuất</span>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className={`flex-1 transition-all duration-300 ${
                sidebarOpen ? 'ml-64' : 'ml-20'
            }`}>
                <main className="h-screen w-full ">
                    <Outlet />
                </main>
            </div>
            <AIChatbox />
        </div>
    );
};

export default AdminLayout;