// 输入验证工具函数

/**
 * 验证IP地址格式（IPv4和IPv6）
 */
export function validateIPAddress(ip: string): { isValid: boolean; error?: string } {
  if (!ip || typeof ip !== 'string') {
    return { isValid: false, error: 'IP地址不能为空' };
  }

  const trimmedIP = ip.trim();
  
  // IPv4 验证
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (ipv4Regex.test(trimmedIP)) {
    return { isValid: true };
  }

  // IPv6 验证（简化版）
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
  if (ipv6Regex.test(trimmedIP)) {
    return { isValid: true };
  }

  // IPv6 压缩格式验证
  const ipv6CompressedRegex = /^(([0-9a-fA-F]{1,4}:)*)?::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$|^::$/;
  if (ipv6CompressedRegex.test(trimmedIP)) {
    return { isValid: true };
  }

  return { isValid: false, error: '请输入有效的IP地址格式（IPv4或IPv6）' };
}

/**
 * 验证域名格式
 */
export function validateDomain(domain: string): { isValid: boolean; error?: string } {
  if (!domain || typeof domain !== 'string') {
    return { isValid: false, error: '域名不能为空' };
  }

  const trimmedDomain = domain.trim();
  
  // 基本长度检查
  if (trimmedDomain.length > 253) {
    return { isValid: false, error: '域名长度不能超过253个字符' };
  }

  // 域名格式验证
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!domainRegex.test(trimmedDomain)) {
    return { isValid: false, error: '请输入有效的域名格式' };
  }

  // 检查是否包含有效的顶级域名
  const parts = trimmedDomain.split('.');
  if (parts.length < 2) {
    return { isValid: false, error: '域名必须包含至少一个点' };
  }

  const tld = parts[parts.length - 1];
  if (!tld || tld.length < 2) {
    return { isValid: false, error: '顶级域名至少需要2个字符' };
  }

  return { isValid: true };
}

/**
 * 验证URL格式
 */
export function validateURL(url: string): { isValid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL不能为空' };
  }

  const trimmedURL = url.trim();
  
  try {
    const urlObj = new URL(trimmedURL);
    
    // 检查协议
    const allowedProtocols = ['http:', 'https:', 'ftp:', 'ftps:', 'redis:', 'mysql:', 'mongodb:', 'postgresql:'];
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return { 
        isValid: false, 
        error: `不支持的协议: ${urlObj.protocol}。支持的协议: ${allowedProtocols.join(', ')}` 
      };
    }

    // 检查主机名
    if (!urlObj.hostname) {
      return { isValid: false, error: 'URL必须包含有效的主机名' };
    }

    // 如果主机名是IP地址，验证IP格式
    const ipValidation = validateIPAddress(urlObj.hostname);
    if (!ipValidation.isValid) {
      // 如果不是有效IP，验证是否为有效域名
      const domainValidation = validateDomain(urlObj.hostname);
      if (!domainValidation.isValid) {
        return { isValid: false, error: 'URL中的主机名必须是有效的IP地址或域名' };
      }
    }

    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : '请输入有效的URL格式' 
    };
  }
}

/**
 * 验证应用名称
 */
export function validateAppName(name: string): { isValid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: '应用名称不能为空' };
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length < 1) {
    return { isValid: false, error: '应用名称不能为空' };
  }

  if (trimmedName.length > 100) {
    return { isValid: false, error: '应用名称长度不能超过100个字符' };
  }

  // 检查特殊字符（允许中文、英文、数字、空格、连字符、下划线、点号）
  const nameRegex = /^[\u4e00-\u9fa5a-zA-Z0-9\s._-]+$/;
  if (!nameRegex.test(trimmedName)) {
    return { isValid: false, error: '应用名称只能包含中文、英文、数字、空格、连字符、下划线和点号' };
  }

  return { isValid: true };
}

/**
 * 验证网络配置（至少需要一个网络字段）
 */
export function validateNetworkConfig(ip?: string, domain?: string, url?: string): { isValid: boolean; error?: string } {
  const hasIP = ip?.trim();
  const hasDomain = domain?.trim();
  const hasURL = url?.trim();

  if (!hasIP && !hasDomain && !hasURL) {
    return { isValid: false, error: 'IP地址、域名、URL至少需要填写一个' };
  }

  // 验证IP地址
  if (hasIP && ip) {
    const ipValidation = validateIPAddress(ip);
    if (!ipValidation.isValid) {
      return ipValidation;
    }
  }

  // 验证域名
  if (hasDomain && domain) {
    const domainValidation = validateDomain(domain);
    if (!domainValidation.isValid) {
      return domainValidation;
    }
  }

  // 验证URL
  if (hasURL && url) {
    const urlValidation = validateURL(url);
    if (!urlValidation.isValid) {
      return urlValidation;
    }
  }

  return { isValid: true };
}

/**
 * 完整的应用表单验证
 */
export function validateAppForm(data: {
  appName: string;
  appType: string;
  ip?: string;
  domain?: string;
  url?: string;
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // 验证应用名称
  const nameValidation = validateAppName(data.appName);
  if (!nameValidation.isValid) {
    errors.appName = nameValidation.error!;
  }

  // 验证分类
  if (!data.appType?.trim()) {
    errors.appType = '必须选择应用分类';
  }

  // 验证网络配置
  const networkValidation = validateNetworkConfig(data.ip, data.domain, data.url);
  if (!networkValidation.isValid) {
    errors.network = networkValidation.error!;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

