const chai = require('chai');

class AuthHelper {
  constructor(agent) {
    this.agent = agent;
    this.currentUser = null;
  }

  async login(email = 'student@test.com', password = 'password123') {
    const res = await this.agent
      .post('/api/auth/login')
      .send({ email, password });
    
    if (res.status === 200) {
      this.currentUser = res.body.user;
    }
    
    return res;
  }

  async logout() {
    const res = await this.agent.post('/api/auth/logout');
    this.currentUser = null;
    return res;
  }

  async checkAuth() {
    return await this.agent.get('/api/auth/check');
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }

  getCurrentUser() {
    return this.currentUser;
  }
}

module.exports = AuthHelper;
