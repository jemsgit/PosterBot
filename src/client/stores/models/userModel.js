import { types, getSnapshot } from 'mobx-state-tree';
import axios from 'axios';
import config from '../../../config'

const UserModel = types
            .model('UserModel', {
              userName: types.string,
              isAuth: types.boolean,
              login: types.string,
              password: types.string
            })
            .actions(self => {
              async function authenticateUser() {
                  let result
                  try{
                    result = await axios.post(`${config.apiHost}/login`, {
                      firstName: 'Fred',
                      lastName: 'Flintstone'
                    })
                } catch(e){
                  console.log(e);
                }
                  console.log(result)
              }

              return {
                  authenticateUser
              }
            })

export default UserModel;
