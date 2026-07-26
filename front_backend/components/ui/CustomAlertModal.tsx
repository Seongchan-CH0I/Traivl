"use client";

import React from 'react';

interface CustomAlertModalProps {
  isOpen: boolean;
  type: 'alert' | 'confirm';
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function CustomAlertModal({
  isOpen,
  type,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "확인",
  cancelText = "취소"
}: CustomAlertModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: '340px',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Icon based on type/message */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: type === 'confirm' ? '#fff1f2' : '#f3e8ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          marginBottom: '16px'
        }}>
          {type === 'confirm' ? '⚠️' : '✨'}
        </div>

        {title && (
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '8px',
            lineHeight: '1.4'
          }}>
            {title}
          </h3>
        )}

        <p style={{
          fontSize: '15px',
          color: '#64748b',
          lineHeight: '1.6',
          marginBottom: '24px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'keep-all'
        }}>
          {message}
        </p>

        <div style={{
          display: 'flex',
          gap: '10px',
          width: '100%'
        }}>
          {type === 'confirm' && (
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#64748b',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: type === 'confirm' ? '#ff5252' : '#8c52ff',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: type === 'confirm' ? '0 4px 10px rgba(255, 82, 82, 0.2)' : '0 4px 10px rgba(140, 82, 255, 0.2)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
