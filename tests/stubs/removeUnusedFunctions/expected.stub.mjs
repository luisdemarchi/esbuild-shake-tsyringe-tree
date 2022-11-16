const UtilInvoke = class {
    static testtest(item) {
        return !!item;
    }
    static async unusedAndNotRemoved(data) {
        return 'unused';
    }
};
const Util = class {
    static get unusedDate() {
        return Date;
    }
    static get invoke() {
        return UtilInvoke;
    }
};
const CreateUserUseCase = class {
    execute(user) {
        return 'test';
    }
};
const UserController = class {
    constructor() {
        this.createUserUseCase = new CreateUserUseCase();
    }
    createUser(data) {
        const result = this.createUserUseCase.execute();
        if (Util.invoke.testtest(data) && this.usedFunction()) {
            return true;
        }
        return result;
    }
    usedFunction() {
        return true;
    }
};
const handler = () => {
    const userController = new UserController();
    const anotherReference = userController;
    return anotherReference.createUser('');
};

export { handler };
