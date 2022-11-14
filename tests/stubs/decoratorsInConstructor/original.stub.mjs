// ----------
// solving classes started in constructor
// ----------

/* eslint-disable no-class-assign */
/* eslint-disable no-use-before-define */
/* eslint-disable node/no-missing-import */
/* eslint-disable no-const-assign */
/* eslint-disable no-undef */

import { injectable, inject, container } from 'tsyringe';
container.register('ICreateUserUseCase', CreateUserUseCase);
const CreateUserUseCase = class {
    execute(data) {
        return data === 'ok';
    }
};
const UserController = class {
    constructor(createUserUseCase) {
        this.createUserUseCase = createUserUseCase;
    }

    createUser(data) {
        if (this.createUserUseCase.execute(data)) {
            return true;
        }

        return false;
    }
};

// decorator tsyringe generated after running the esbuild
UserController = __decorateClass(
    [injectable(), __decorateParam(0, inject('ICreateUserUseCase'))],
    UserController
);

const handler = () => {
    const userController = new UserController();
    userController.createUser('ok');
};

export { handler };
