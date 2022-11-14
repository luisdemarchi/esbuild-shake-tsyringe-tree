const CreateUserUseCase = class {
    execute(data) {
        return data === 'ok';
    }
};
const UserController = class {
    constructor() {
        this.createUserUseCase = new CreateUserUseCase();
    }

    createUser(data) {
        if (this.createUserUseCase.execute(data)) {
            return true;
        }

        return false;
    }
};

const handler = () => {
    const userController = new UserController();
    userController.createUser('ok');
};

export { handler };
