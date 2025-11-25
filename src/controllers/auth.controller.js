const { UserService } = require('../services/user.service');
const { RegisterRequestModel } = require('../model/request/user/register.request');
const { LoginRequestModel } = require('../model/request/user/login.request');
const { UserResponseModel } = require('../model/response/user/user.response');
const { ResponseUtil, ErrorHandlerUtil } = require('../utils');
const { JwtUtil } = require('../utils/jwt.util');

class AuthController {
  constructor() {
    this.userService = new UserService();
  }

  register = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const registerRequest = new RegisterRequestModel(req.body);
    const validation = registerRequest.validate();

    if (!validation.isValid) {
      ResponseUtil.validationError(res, validation.errors);
      return;
    }

    const user = await this.userService.register(registerRequest);
    const userResponse = UserResponseModel.fromEntity(user);

    const token = JwtUtil.generateToken({
      userId: user.id,
      email: user.email,
    });

    ResponseUtil.created(res, {
      token,
      user: userResponse,
      message: 'User registered successfully',
    });
  });

  login = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const loginRequest = new LoginRequestModel(req.body);
    const validation = loginRequest.validate();

    if (!validation.isValid) {
      ResponseUtil.validationError(res, validation.errors);
      return;
    }

    const user = await this.userService.login(
      loginRequest.email,
      loginRequest.password
    );
    const userResponse = UserResponseModel.fromEntity(user);

    const token = JwtUtil.generateToken({
      userId: user.id,
      email: user.email,
    });

    ResponseUtil.success(res, {
      token,
      user: userResponse,
      message: 'Login successful',
    });
  });

  getProfile = ErrorHandlerUtil.handleAsync(async (req, res) => {
    const user = await this.userService.getUserById(req.user.id);
    const userResponse = UserResponseModel.fromEntity(user);

    ResponseUtil.success(res, userResponse);
  });
}

module.exports = { AuthController };

