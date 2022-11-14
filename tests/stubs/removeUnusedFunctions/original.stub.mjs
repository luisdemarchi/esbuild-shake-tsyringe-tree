// -------------------
// removing unused functions inside classes
// -------------------

const varUnused = 'test';

const unusedClass = class {
    execute() {
        return 'unused';
    }
};
const UnusedClassB = class {
    execute() {
        return 'unused';
    }
};

const UtilInvoke = class {
    static testtest(item) {
        return !!item;
    }
    // methods without an object created are not removed for safety
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
    unusedFunction1(user) {
        return 'test';
    }
};

const UserController = class {
    constructor() {
        this.createUserUseCase = new CreateUserUseCase();
        this.refUnused = new UnusedClassB();
    }
    createUser(data) {
        const result = this.createUserUseCase.execute();
        if (Util.invoke.testtest(data)) {
            return true;
        }
        return result;
    }
    unusedFunction2() {
        this.refUnused.execute();
        return true;
    }
    async unusedFunction3() {
        if (this.unusedFunction2()) {
            return 'test';
        }
    }
};
const handler = () => {
    const userController = new UserController();
    const anotherReference = userController;
    return anotherReference.createUser('');
};
export { handler };
