import React from 'react';
import { Button, Checkbox, Form, Input } from 'antd';

const onFinish = (values, props) => {
    const { setIsLogin, setUser } = props
    setIsLogin(true)
    setUser(values)
};

const App = (props) => (

    <div style={{ width: window.innerWidth, height: window.innerHeight, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Form
            name="basic"
            labelCol={{
                span: 8,
            }}
            wrapperCol={{
                span: 16,
            }}
            style={{
                maxWidth: 600,
            }}
            initialValues={{
                remember: true,
            }}
            onFinish={(e) => onFinish(e, props)}
            autoComplete="off"
        >
            <Form.Item
                label="用户名"
                name="username"
                rules={[
                    {
                        required: true,
                        message: 'Please input your username!',
                    },
                ]}
            >
                <Input placeholder='请输入用户名' />
            </Form.Item>

            <Form.Item
                wrapperCol={{
                    offset: 8,
                    span: 16,
                }}
            >
                <Button type="primary" htmlType="submit">
                    登录
                </Button>
            </Form.Item>
        </Form>
    </div>
);
export default App;