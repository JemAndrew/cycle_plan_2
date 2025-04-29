import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
  Layout,
  List,
  Input,
  Button,
  Typography,
  message as antdMessage,
  Divider,
} from 'antd';

const { Title } = Typography;
const { Sider, Content } = Layout;

const socket = io('http://localhost:5001');

const MessagePage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [messageText, setMessageText] = useState('');
  const [chatLog, setChatLog] = useState([]);

  const username = localStorage.getItem('userId');

  useEffect(() => {
    if (!username) {
      antdMessage.error('Please log in first!');
      return;
    }

    socket.emit('join', { username });

    socket.on('new_private_message', (data) => {
      if (data.sender === selectedUser) {
        setChatLog(prev => [...prev, { sender: data.sender, message: data.message }]);
      }
    });

    fetchUsers();

    return () => {
      socket.off('new_private_message');
    };
  }, [username, selectedUser]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/users');
      const data = await res.json();
      setUsers(data.filter(user => user !== username));
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const sendMessage = () => {
    if (!selectedUser) {
      antdMessage.warning('Select a user.');
      return;
    }

    socket.emit('private_message', {
      sender: username,
      recipient: selectedUser,
      message: messageText.trim()
    });

    setChatLog(prev => [...prev, { sender: 'Me', message: messageText }]);
    setMessageText('');
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider width={250} style={{ backgroundColor: '#f0f2f5', padding: '20px' }}>
        <Title level={4}>Users</Title>
        <List
          itemLayout="horizontal"
          dataSource={users}
          renderItem={user => (
            <List.Item
              style={{
                cursor: 'pointer',
                backgroundColor: user === selectedUser ? '#e6f7ff' : 'transparent',
                borderRadius: '5px',
                padding: '10px',
              }}
              onClick={() => {
                setSelectedUser(user);
                setChatLog([]); // clear previous chat on new selection
              }}
            >
              <span style={{ fontWeight: user === selectedUser ? 'bold' : 'normal' }}>{user}</span>
            </List.Item>
          )}
        />
      </Sider>

      <Layout>
        <Content style={{ padding: '30px' }}>
          {selectedUser ? (
            <>
              <Title level={3}>Chat with {selectedUser}</Title>

              <List
                bordered
                size="small"
                style={{ marginBottom: '20px', maxHeight: '60vh', overflowY: 'auto' }}
                dataSource={chatLog}
                renderItem={(item, index) => (
                  <List.Item key={index}>
                    <b>{item.sender}:</b> {item.message}
                  </List.Item>
                )}
              />

              <Input.TextArea
                rows={3}
                placeholder="Type your message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                style={{ marginBottom: '10px' }}
              />
              <Button type="primary" onClick={sendMessage}>
                Send Message
              </Button>
            </>
          ) : (
            <div style={{ textAlign: 'center', paddingTop: '40px', color: '#888' }}>
              <Title level={4}>Select a user to start chatting</Title>
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MessagePage;
