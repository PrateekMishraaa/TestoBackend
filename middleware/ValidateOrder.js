const validateOrder = (req, res, next) => {
  const errors = [];
  const orderData = req.body;

  // 验证姓名
  if (!orderData.name || orderData.name.trim().length < 2) {
    errors.push({
      field: 'name',
      message: 'Name is required and must be at least 2 characters'
    });
  }

  // 验证年龄
  const age = parseInt(orderData.age);
  if (!age || age < 18 || age > 100) {
    errors.push({
      field: 'age',
      message: 'Age must be between 18 and 100'
    });
  }

  // 验证体重
  const weight = parseInt(orderData.weight);
  if (!weight || weight < 30 || weight > 200) {
    errors.push({
      field: 'weight',
      message: 'Weight must be between 30 and 200 kg'
    });
  }

  // 验证电话
  const phoneRegex = /^\d{10}$/;
  if (!orderData.phone || !phoneRegex.test(orderData.phone)) {
    errors.push({
      field: 'phone',
      message: 'Phone number must be 10 digits'
    });
  }

  // 验证邮箱
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!orderData.email || !emailRegex.test(orderData.email)) {
    errors.push({
      field: 'email',
      message: 'Please enter a valid email address'
    });
  }

  // 验证地址
  if (!orderData.address || orderData.address.trim().length < 10) {
    errors.push({
      field: 'address',
      message: 'Address is required and must be at least 10 characters'
    });
  }

  // 验证邮政编码
  const zipRegex = /^\d{6}$/;
  if (!orderData.zipCode || !zipRegex.test(orderData.zipCode)) {
    errors.push({
      field: 'zipCode',
      message: 'ZIP code must be 6 digits'
    });
  }

  // 如果有错误，返回验证失败
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // 验证通过，继续
  next();
};

export default validateOrder;