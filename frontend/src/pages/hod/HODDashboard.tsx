import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/dashboard/StatCard';
import { ActivityFeed } from '../../components/dashboard/ActivityFeed';
import { Card } from '../../components/ui/Card';

export const HODDashboard: React.FC = () => {
  return (
    <div>
      <PageHeader title="HOD Dashboard" subtitle="Overview of department metrics" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Students" value="450" trend="12%" trendUp icon={<span className="text-xl">👨‍🎓</span>} />
        <StatCard title="Total Staff" value="42" icon={<span className="text-xl">👨‍🏫</span>} />
        <StatCard title="Pending Approvals" value="15" icon={<span className="text-xl text-yellow-500">⚠️</span>} />
        <StatCard title="Reports Generated" value="89" icon={<span className="text-xl text-purple-500">📄</span>} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="heading-2 text-lg mb-4">Recent Activities</h3>
          <ActivityFeed activities={[
            { id: '1', text: 'Mark entry approved for Network Security', time: '2 hours ago' },
            { id: '2', text: 'New student enrolled: Arun Kumar', time: '5 hours ago' }
          ]} />
        </Card>
      </div>
    </div>
  );
};
