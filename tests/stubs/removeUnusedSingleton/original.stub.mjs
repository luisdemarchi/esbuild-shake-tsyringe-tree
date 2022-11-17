// -------------------
// removing unused functions inside classes
// -------------------

const varUnused = 'test';

const UnusedClassA = class {
    execute() {
        return 'unused';
    }
};
const SuperClassPrimary = class SuperClassB {
    constructor(name) {
        this.name = name;
    }

    check() {
        return this.name;
    }
};

const SuperClassB = class extends SuperClassPrimary {
    constructor(tableName) {
        super(tableName);
    }
    unusedFunction() {
        return 'OK';
    }
};

const UsedClassB = class extends SuperClassB {
    constructor() {
        const tableName = process.env['DYNAMODB_TABLENAME'];
        super(tableName);
    }

    execute() {
        return 'unused';
    }
};

const unusedClassA_singleton = new UnusedClassA();
const usedClassB_singleton = new UsedClassB();

const UnusedController = class {
    constructor() {
        this.classA = unusedClassA_singleton;
        this.classB = usedClassB_singleton;
    }

    usedFunction() {
        if (this.classB.check()) {
            return 'OK';
        }
        return this.classB.execute();
    }

    unusedFunction() {
        return this.classA.execute();
    }
};

const UserController = class {
    constructor() {
        this.classA = unusedClassA_singleton;
        this.classB = usedClassB_singleton;
        this.unusedController = new UnusedController();
    }

    usedFunction() {
        if (this.classB.check()) {
            return 'OK';
        }
        return this.classB.execute();
    }

    unusedFunction() {
        return this.classA.execute();
    }
};
const handler = () => {
    const userController = new UserController();
    return userController.usedFunction();
};
export { handler };
