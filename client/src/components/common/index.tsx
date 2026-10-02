import React from 'react';

export const Badge = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>
    {children}
  </span>
);

export const Button = ({ children, className = '', variant = 'primary', ...props }: any) => {
  const baseStyle = "px-4 py-2 rounded font-medium transition-colors focus:outline-none";
  const variants: Record<string, string> = {
    primary: "bg-[#1F4E79] text-white hover:bg-[#14385A]",
    secondary: "bg-[#2A7F7F] text-white hover:bg-[#1D5A5A]",
    outline: "border border-[#D9E0E7] text-[#2A3038] hover:bg-[#F7F9FC]"
  };
  return <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-[#D9E0E7] rounded shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

export const Input = (props: any) => (
  <input className={`border border-[#D9E0E7] rounded px-3 py-2 text-[#2A3038] focus:outline-none focus:border-[#1F4E79] ${props.className || ''}`} {...props} />
);

export const Select = (props: any) => (
  <select className={`border border-[#D9E0E7] rounded px-3 py-2 text-[#2A3038] focus:outline-none focus:border-[#1F4E79] ${props.className || ''}`} {...props} />
);

export const Spinner = () => (
  <div className="animate-spin h-5 w-5 border-2 border-[#1F4E79] border-t-transparent rounded-full"></div>
);

export const Modal = ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-lg">
        {children}
        <Button onClick={onClose} className="mt-4">Close</Button>
      </div>
    </div>
  );
};
