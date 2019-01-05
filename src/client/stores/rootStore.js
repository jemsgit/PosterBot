import { types, getSnapshot } from 'mobx-state-tree';
import UserModel from './models/userModel'

export const RootStore = types
	.model('RootStore', {
    userStore: types.optional(UserModel, {})
  })

const rootStore = RootStore.create({
		userStore: {
			isAuth: false,
			login: '',
			password: ''
		}
});

export default rootStore;
