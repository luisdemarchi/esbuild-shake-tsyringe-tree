/* eslint-disable eslint-comments/require-description */
/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable node/no-missing-import */
// ----------
// resolving classes registered in tsyringe container
// ----------

import {
    container as containerTest,
    injectable as injectable2,
    inject,
} from 'tsyringe';

const UserRepository = class {
    save() {
        console.log('UserRepository save');
    }
};

let UserController = class {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async updateUser() {
        this.userRepository.save();
    }
};

UserController = __decorateClass(
    [injectable2(), __decorateParam(0, inject('IUserRepository'))],
    UserController
);

containerTest.registerSingleton('IUserRepository', UserRepository);
containerTest.register('IUserController', UserController);
const diContainer = containerTest;

const handler = () => {
    const userController = diContainer.resolve('IUserController');
    userController.updateUser();
};

export { handler };
