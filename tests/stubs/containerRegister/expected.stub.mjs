const UserRepository = class {
    save() {
        console.log('UserRepository save');
    }
};

const __UserRepository__singleton = new UserRepository();

let UserController = class {
    constructor() {
        this.userRepository = __UserRepository__singleton;
    }
    async updateUser() {
        this.userRepository.save();
    }
};
const handler = () => {
    const userController = new UserController();
    userController.updateUser();
};

export { handler };
