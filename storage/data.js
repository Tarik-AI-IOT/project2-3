import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from "react-native-uuid";
import { useState } from "react";

export const ID = {
  unique: () => uuid.v4(),
};

export const account = {
  async create(id, email, password, firstName, lastName) {
    const users = JSON.parse(await AsyncStorage.getItem('users')) || [];

    if (users.find(user => user.email === email)) {
      throw new Error('User already exists');
    }


    const newUser = { id: ID.unique(), email, password, firstName, lastName };
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


