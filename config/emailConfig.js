// 邮件配置
export const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  },
  from: process.env.EMAIL_FROM || 'noreply@healthveda.com',
  admin: process.env.EMAIL_ADMIN || 'admin@healthveda.com'
};

// 检查邮件配置是否完整
export const isEmailConfigured = () => {
  return !!(emailConfig.auth.user && emailConfig.auth.pass);
};

// 获取配置状态
export const getEmailConfigStatus = () => {
  const configured = isEmailConfigured();
  return {
    configured,
    host: configured ? emailConfig.host : 'Not configured',
    user: configured ? emailConfig.auth.user : 'Not configured',
    from: emailConfig.from
  };
};