'use client';

import React from 'react';
import { Copy, Check } from 'lucide-react';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { Button, type ButtonProps } from './Button';

interface CopyButtonProps extends ButtonProps {
  value: string;
  label?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ value, label = 'Copy', variant = 'secondary', size = 'sm', className, onClick, ...props }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={(e) => {
        copyToClipboard(value);
        if (onClick) onClick(e);
      }}
      disabled={!value}
      {...props}
    >
      {isCopied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
      {isCopied ? 'Copied' : label}
    </Button>
  );
};
