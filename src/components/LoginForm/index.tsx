import type React from 'react';
import { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Button,
  Checkbox,
  Space,
  message,
  Col,
  Flex,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  GithubOutlined,
  WechatFilled,
  QqOutlined,
} from '@ant-design/icons';
import './index.scss';
import {
  loginWithCode,
  loginWithPassword,
  loginWithThird,
  sendCode,
} from '@/api/login';
import Cookies from 'js-cookie';
import { useDispatch } from 'react-redux';
import { setUserLogin } from '@/store/modules/userSlice';
import { setRoutes } from '@/store/modules/routeSlice';

interface LoginRegisterModalProps {
  open?: boolean;
  onCancel?: () => void;
  onLogin?: () => void;
}

const LoginRegisterModal: React.FC<LoginRegisterModalProps> = ({
  open = false,
  onCancel,
  onLogin,
}) => {
  const [activeTab, setActiveTab] = useState('login');
  const [passwordForm] = Form.useForm();
  const [codeForm] = Form.useForm();
  const [countdown, setCountdown] = useState(0); // 倒计时状态
  const [isPassword, setIsPassword] = useState(true);
  const [QRModalVisible, setQRModalVisible] = useState(false);
  const [QRcode, setQRcode] = useState('');
  const dispatch = useDispatch();
  // 在组件中添加
  useEffect(() => {
    if (!isPassword) {
      // 确保表单实例重新连接
      setTimeout(() => {
        codeForm.resetFields();
      }, 0);
    }
  }, [isPassword, codeForm]);
  // 启动倒计时
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 密码登录提交
  const handlePasswordLogin = async () => {
    try {
      const values = await passwordForm.validateFields();

      console.log(JSON.stringify(values));

      const res = await loginWithPassword(values);
      console.log(res, 'res');

      console.log(values);
      if (res.data && res.data.token) {
        // 设置 Cookie，配置过期时间等属性
        Cookies.set('authToken', res.data.token, {
          httpOnly: true, // 防止 XSS
          expires: 7, // 7天过期
          secure: true, // 仅在 HTTPS 下传输
          sameSite: 'strict', // 防止 CSRF 攻击
        });
      }
      const info = await dispatch({
        type: 'user',
      });

      await dispatch(setRoutes(res.data.menuItem));

      message.success('登录成功！');
      onLogin?.();
    } catch (error) {
      console.error('密码登录失败:', error);
      message.error('登录失败，请检查用户名和密码');
    }
  };
  // 发送验证码 - 单独验证邮箱字段
  const handleSendCode = async () => {
    try {
      const values = await codeForm.validateFields(['email']);
      startCountdown();
      const res = await sendCode(values);
      message.success('发送成功！');
    } catch (errorInfo) {
      console.log('Failed:', errorInfo);
    }
  };

  //验证码登录提交 - 验证邮箱和验证码
  const handleCodeLogin = async () => {
    try {
      // 验证所有必填字段（邮箱和验证码）
      const validatedValues = await codeForm.validateFields();

      console.log('验证码登录信息:', validatedValues);
      // 这里调用验证码登录API
      const res = await loginWithCode(validatedValues);

      message.success('登录成功！');
      // 更新 Redux 状态
      dispatch(setUserLogin({}));

      onLogin?.();
    } catch (error) {
      if (error.errorFields) {
        // 表单验证失败
        console.log('表单验证失败:', error);
        // Ant Design 会自动显示字段级别的错误信息
      } else {
        // API调用失败
        console.error('验证码登录失败:', error);
        message.error('登录失败，请检查邮箱和验证码');
      }
    }
  };

  // 忘记密码
  const handleForgotPassword = () => {
    message.info('请联系管理员重置密码');
  };

  // 第三方登录
  const handleSocialLogin = async (provider: string) => {
    setQRModalVisible(true);
    const { data } = await loginWithThird(provider);
    setQRcode(data);
  };

  return (
    <>
      <Modal
        className="login-modal"
        style={{ width: '400px' }}
        title={
          <div
            style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold' }}
          >
            登录掘金畅享更多权益
          </div>
        }
        open={open}
        onCancel={onCancel}
        footer={null}
        centered
        closable={true}
      >
        <div style={{ padding: '20px' }}>
          <Col className="login-body">
            <div style={{ display: isPassword ? 'block' : 'none' }}>
              <div style={{ marginBottom: '20px' }}>密码登录</div>
              <Form name="passwordLogin" size="large" form={passwordForm}>
                <Form.Item
                  name="email"
                  // className="userName"
                  rules={[{ required: true, message: '请输入用户名!' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="用户名" />
                </Form.Item>
                <Form.Item
                  name="pwd"
                  rules={[
                    { required: true, message: '请输入密码!' },
                    { min: 6, message: '密码至少6位字符!' },
                  ]}
                >
                  <Input
                    prefix={<LockOutlined />}
                    type="password"
                    placeholder="密码"
                  />
                </Form.Item>
                <Form.Item>
                  <Flex justify="space-between" align="center">
                    <Form.Item name="remember" valuePropName="checked" noStyle>
                      <Checkbox>记住密码</Checkbox>
                    </Form.Item>
                    <Button type="link" onClick={handleForgotPassword}>
                      忘记密码
                    </Button>
                  </Flex>
                </Form.Item>

                <Form.Item>
                  <Button block type="primary" onClick={handlePasswordLogin}>
                    登录/注册
                  </Button>
                </Form.Item>
              </Form>
            </div>

            <div style={{ display: isPassword ? 'none' : 'block' }}>
              <div style={{ marginBottom: '20px' }}>验证码登录</div>
              <Form
                name="codeLogin"
                size="large"
                form={codeForm}
                autoComplete="off"
              >
                <Form.Item
                  name="email"
                  className="email"
                  rules={[
                    { required: true, message: '邮箱不能为空' },
                    { type: 'email', message: '请输入正确的邮箱格式!' },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="邮箱地址"
                    autoComplete="off"
                  />
                </Form.Item>
                <Form.Item
                  name="code"
                  rules={[
                    { required: true, message: '请输入验证码!' },
                    { len: 6, message: '验证码应为6位数字!' },
                  ]}
                >
                  <Input
                    prefix={<LockOutlined />}
                    type="text"
                    placeholder="6位验证码"
                    autoComplete="off"
                    maxLength={6}
                  />
                </Form.Item>
                <Form.Item>
                  <Flex justify="space-between" align="center">
                    <Form.Item name="remember" valuePropName="checked" noStyle>
                      <Checkbox>记住登录状态</Checkbox>
                    </Form.Item>
                    <Button
                      type="link"
                      onClick={handleSendCode}
                      disabled={countdown > 0}
                    >
                      {countdown > 0 ? `${countdown}s后重发` : '发送验证码'}
                    </Button>
                  </Flex>
                </Form.Item>

                <Form.Item>
                  <Button block type="primary" onClick={handleCodeLogin}>
                    登录/注册
                  </Button>
                </Form.Item>
              </Form>
            </div>

            {/* 第三方登录和切换登录方式 */}
            <div style={{ marginTop: '10px' }}>
              <Flex justify="space-between">
                <div>
                  其它登录：
                  <Space>
                    <Button
                      shape="circle"
                      icon={
                        <WechatFilled
                          style={{ fontSize: '20px', color: '#44b035' }}
                        />
                      }
                      color="default"
                      variant="filled"
                      onClick={() => handleSocialLogin('wechat')}
                    />
                    <Button
                      shape="circle"
                      icon={<GithubOutlined style={{ fontSize: '20px' }} />}
                      color="default"
                      variant="filled"
                      onClick={() => handleSocialLogin('gitHub')}
                    />
                    <Button
                      shape="circle"
                      icon={
                        <QqOutlined
                          style={{ fontSize: '20px', color: '#27acffff' }}
                        />
                      }
                      color="default"
                      variant="filled"
                      onClick={() => handleSocialLogin('QQ')}
                    />
                  </Space>
                </div>

                <Button
                  color="default"
                  variant="link"
                  onClick={() => setIsPassword(!isPassword)}
                >
                  {isPassword ? '验证码登录' : '密码登录'}
                </Button>
              </Flex>
            </div>

            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <Checkbox defaultChecked>
                注册时允许授权注册Trae 用户协议和隐私政策
              </Checkbox>
            </div>
          </Col>
        </div>
      </Modal>
      <Modal open={QRModalVisible} onCancel={() => setQRModalVisible(false)}>
        <img src={QRcode} />
      </Modal>
    </>
  );
};

export default LoginRegisterModal;
