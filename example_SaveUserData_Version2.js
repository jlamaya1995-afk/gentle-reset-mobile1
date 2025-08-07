import { storeAppData, getAppData, removeAppData } from '../utils/AppDataStorage';

const saveProfile = async () => {
  await storeAppData('profile', { name: 'Jane', age: 25 });
};

const showProfile = async () => {
  const profile = await getAppData('profile');
  console.log(profile);
};

const deleteProfile = async () => {
  await removeAppData('profile');
};