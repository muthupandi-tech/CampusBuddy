import { io } from 'socket.io-client';

const URL = 'http://localhost:5000'; // Make sure this matches backend port
export const socket = io(URL, { autoConnect: false });
