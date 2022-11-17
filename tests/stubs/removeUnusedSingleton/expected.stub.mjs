const SuperClassPrimary = class SuperClassB {
    constructor(name) {}
    check() {
        return this.name;
    }
};
const SuperClassB = class extends SuperClassPrimary {
    constructor(tableName) {
        super(tableName);
    }
};
const UsedClassB = class extends SuperClassB {
    constructor() {
        super(tableName);
    }
    execute() {
        return 'unused';
    }
};
const usedClassB_singleton = new UsedClassB();
const UserController = class {
    constructor() {
        this.classB = usedClassB_singleton;
    }
    usedFunction() {
        if (this.classB.check()) {
            return 'OK';
        }
        return this.classB.execute();
    }
};
const handler = () => {
    const userController = new UserController();
    return userController.usedFunction();
};

export { handler };
