import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { useState } from "react";

export const ID = {
  unique: () => uuidv4(),
};

export const account = {
  async create(id, email, password) {
    const users = JSON.parse(await AsyncStorage.getItem('users')) || [];

    if (users.find(user => user.email === email)) {
      throw new Error('User already exists');
    }


    const newUser = { id, email, password };
    users.push(newUser);
    await AsyncStorage.setItem('users', JSON.stringify(users));
    await AsyncStorage.setItem('currentUser', JSON.stringify(newUser));
    return newUser;
  },

    // login with email & password
  async createEmailPasswordSession(email, password) {
    const users = JSON.parse(await AsyncStorage.getItem('users')) || [];
    const foundUser = users.find(u => u.email === email && u.password === password);

    if (!foundUser) {
      throw new Error('Invalid credentials');
    }

    await AsyncStorage.setItem('currentUser', JSON.stringify(foundUser));
    return foundUser;
  },

  // get current logged-in user
  async get() {
    const user = await AsyncStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  },

  // logout
  async deleteSession() {
    await AsyncStorage.removeItem('currentUser');
  },
};


