import { useAuthStore } from '../store/authStore';

export const usePermissions = () => {
  const { user } = useAuthStore();
  
  const isHod = user?.role === 'HOD';
  const isStaff = user?.role === 'STAFF';
  const isStudent = user?.role === 'STUDENT';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return {
    isHod,
    isStaff,
    isStudent,
    isSuperAdmin,
    canApproveMarks: isHod || isSuperAdmin,
    canEnterMarks: isStaff || isHod || isSuperAdmin,
  };
};
