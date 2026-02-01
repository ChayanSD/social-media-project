import React, { ReactNode } from 'react';

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ icon, title, description, className = '' }) => {
  return (
    <div className={`text-center mb-12 ${className}`}>
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shadow-lg">
          {icon}
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
          {title}
        </h1>
      </div>
      <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default PageHeader;

