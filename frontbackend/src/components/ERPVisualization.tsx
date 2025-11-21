import React from 'react';
import { 
  Package, 
  DollarSign, 
  Users, 
  BarChart3, 
  MessageCircle, 
  Settings 
} from 'lucide-react';

const ERPVisualization = () => {
  const modules = [
    {
      icon: Package,
      name: 'Inventory',
      description: 'Management',
      angle: 0,
    },
    {
      icon: DollarSign,
      name: 'Finance',
      description: 'Accounting',
      angle: 60,
    },
    {
      icon: Users,
      name: 'HR',
      description: 'Resources',
      angle: 120,
    },
    {
      icon: BarChart3,
      name: 'Analytics',
      description: 'Insights',
      angle: 180,
    },
    {
      icon: MessageCircle,
      name: 'CRM',
      description: 'Relations',
      angle: 240,
    },
    {
      icon: Settings,
      name: 'Operations',
      description: 'Management',
      angle: 300,
    },
  ];

  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#1E1E2F' }}>
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-blue-500/10 via-transparent to-transparent"></div>
      
      {/* Central hub */}
      <div className="relative z-10">
        {/* Main circle with glow effect */}
        <div className="relative w-96 h-96 rounded-full border-2 border-blue-400/30 flex items-center justify-center">
          {/* Glowing background circle */}
          <div 
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              background: `radial-gradient(circle, rgba(0, 191, 255, 0.1) 0%, rgba(0, 191, 255, 0.05) 50%, transparent 100%)`,
              boxShadow: `0 0 60px rgba(0, 191, 255, 0.3), inset 0 0 60px rgba(0, 191, 255, 0.1)`
            }}
          ></div>
          
          {/* Inner rotating ring */}
          <div className="absolute w-80 h-80 rounded-full border border-blue-400/20 animate-spin-slow"></div>
          
          {/* Company branding in center */}
          <div className="relative z-20 text-center">
            <h1 className="text-4xl text-white mb-2" style={{ fontWeight: 600 }}>
              Circle Soft
            </h1>
            <p className="text-blue-400 text-lg">ERP Solutions</p>
            <div className="mt-4 w-16 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mx-auto rounded-full"></div>
          </div>
        </div>

        {/* Orbital modules */}
        {modules.map((module, index) => {
          const Icon = module.icon;
          const radius = 240; // Distance from center
          const x = Math.cos((module.angle * Math.PI) / 180) * radius;
          const y = Math.sin((module.angle * Math.PI) / 180) * radius;
          
          return (
            <div
              key={module.name}
              className="absolute w-24 h-24 flex items-center justify-center animate-orbit"
              style={{
                left: `calc(50% + ${x}px - 48px)`,
                top: `calc(50% + ${y}px - 48px)`,
                animationDelay: `${index * 3.33}s`
              }}
            >
              {/* Module container with glow */}
              <div 
                className="relative w-full h-full rounded-full border border-blue-400/40 flex items-center justify-center group hover:scale-110 transition-all duration-300 cursor-pointer"
                style={{
                  background: `radial-gradient(circle, rgba(0, 191, 255, 0.15) 0%, rgba(30, 30, 47, 0.8) 70%)`,
                  boxShadow: `0 0 20px rgba(0, 191, 255, 0.4)`
                }}
              >
                {/* Icon */}
                <Icon 
                  size={28} 
                  className="text-blue-400 group-hover:text-blue-300 transition-colors duration-300" 
                />
                
                {/* Module label */}
                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-sm font-medium">{module.name}</p>
                  <p className="text-blue-400 text-xs">{module.description}</p>
                </div>
              </div>

              {/* Connection line to center */}
              <div 
                className="absolute w-0.5 bg-gradient-to-r from-blue-400/30 to-transparent"
                style={{
                  height: `${radius - 48}px`,
                  left: '50%',
                  top: '50%',
                  transformOrigin: 'top center',
                  transform: `translateX(-50%) rotate(${module.angle + 180}deg)`
                }}
              ></div>
            </div>
          );
        })}

        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/60 rounded-full animate-float"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
              animationDelay: `${i * 0.5}s`
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default ERPVisualization;