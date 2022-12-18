if (typeof window === "undefined") fetch = require('node-fetch');
if (typeof window === "undefined") WebSocket = require('ws');
const { EventEmitter } = require('events');
const md5 = require('md5');

class ApiChatMessage {
    /**
     * Name of the sender
     */
    sender;
    /**
     * Text content
     */
    content;
    /**
     * MD5 of message
     */
    md5;
    /**
     * Metadata of message (e.g. someone joined or left)
     */
    data;
    /**
     * new Date().getTime() of the message
     */
    date;
    /**
     * Unique ID of message
     */
    id;
    /**
     * Chat ID
     */
    chatId;
}

class ApiChat {
    title;
    members;
    messages;
    currentlyOnline;
    isEncryptionEnabled;
    public;
}

class Account {
    static endpoint = "https://msg.darkcoder15.tk";
    /**
     * Register an account
     * @param {String} username Username
     * @param {String} password Password
     * @returns 
     */
    static async register(username, password) {
        let f = await fetch(Account.endpoint + '/api/v1/register', {
            method: 'POST',
            body: JSON.stringify({
                username, password
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result.token;
    }

    /**
     * Log in to account
     * @param {String} username Username
     * @param {String} password Password
     * @returns Token
     */
    static async login(username, password) {
        let f = await fetch(Account.endpoint + `/api/v1/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, {
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result.token;
    }
}

class Client extends EventEmitter {
    /**
     * Client's token
     */
    token;
    /**
     * Client's username
     */
    username;
    /**
     * API Endpoint
     */
    endpoint;
    /**
     * Websocket URL
     */
    wsUrl;

    /**
     * Create new client
     * @param {Object|never} options - Client options 
     * @param {boolean|never} options.connect - Whether to connect to /livereadchat or not
     * @param {string|never} options.endpoint - Dinmessage Endpoint
     * @param {string|never} options.token - Client token
     * @param {string|never} options.wsUrl - Websocket URL
     */
    constructor(options) {
        super();
        if (!options) options = {};
        this.endpoint = options.endpoint ?? 'https://msg.darkcoder15.tk';
        this.wsUrl = options.wsUrl ?? 'wss://msg.darkcoder15.tk/livereadchat';
        if (options.token) {
            this.login(options.token).then(() => {
                if (options.connect) {
                    this.connectWS();
                }
            });
        }
    }

    /**
     * Log in to account
     * @param {String} token - Client token
     */
    async login(token) {
        if (this.token) throw new Error("Already authorized");
        this.token = token;
        await this.refreshWhoAmI();
        this.emit('ready');
        return true;
    }

    /**
     * Refresh Who Am I
     * @returns 
     */
    async refreshWhoAmI() {
        let f = await fetch(this.endpoint + '/api/v1/whoami', {
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        this.username = res.result.username;
        this.isAdmin = res.result.isAdmin;
        this.bio = res.result.bio;
        return res.result;
    }

    /**
     * Get chats
     * @returns {String[]} - Array of chat IDs
     */
    async getChats() {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/whoami', {
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result.chats;
    }

    /**
     * Get chat by ID
     * @param {String} chat 
     * @param {boolean} noMessages
     * @returns {ApiChat}
     */
    async getChat(chat, noMessages) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/chat/getChat', {
            method: 'POST',
            body: JSON.stringify({
                chat,
                noMessages
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Change password
     * @param {String} oldPassword
     * @param {String} newPassword
     */
    async changePassword(oldPassword, newPassword) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/changePassword', {
            method: 'POST',
            body: JSON.stringify({
                oldPassword,
                newPassword
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Get message by ID
     * @param {String} chat 
     * @param {String} message 
     * @returns {ApiMessage}
     */
    async getMessage(chat, message) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/chat/getMessage', {
            method: 'POST',
            body: JSON.stringify({
                chat,
                message
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result.message;
    }

    /**
     * Send a message
     * @param {String} chat - Chat ID
     * @param {String} content - Message content
     * @param {Object|never} data - Another data
     * @param {String|never} data.replyTo - Reply to message ID
     * @param {String|never} data.fileName - File name
     */
    async sendMessage(chat, content, data) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/chat/sendMessage', {
            method: 'POST',
            body: JSON.stringify({
                chat,
                content,
                md5: md5(content),
                replyTo: data.replyTo ?? null,
                filename: data.fileName ?? null
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Set bio
     * @param {String} bio - New bio
     * @returns 
     */
    async setBio(bio) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/account', {
            method: 'POST',
            body: JSON.stringify({
                action: 'bio',
                bio
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Upload attachment
     * @param {ArrayBuffer} data - Data
     * @param {String} ext - File extension
     * @returns {Object} file url and name
     */
    async uploadAttachment(data, ext) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/uploadAttachment?ext=' + encodeURIComponent(ext), {
            method: 'POST',
            body: data,
            // mode: 'no-cors',
            headers: {
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Upload avatar
     * @param {ArrayBuffer} data - Data
     * @param {String} ext - File extension
     * @returns {Object} file url and name
     */
    async setAvatar(data) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/uploadAttachment?ext=png&avatar=true', {
            method: 'POST',
            body: data,
            // mode: 'no-cors',
            headers: {
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Send a message
     * @param {String} senderName - Sender name
     * @param {String} chat - Chat ID
     * @param {String} message - Message content
     */
    async sendAnonymousMessage(senderName, chat, message) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/chat/manage', {
            method: 'POST',
            body: JSON.stringify({
                chat,
                message,
                md5: md5(message),
                action: 'anonymousMessage',
                senderName
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Set chat title
     * @param {String} chat - Chat ID
     * @param {String} title - New title
     */
    async setTitle(chat, title) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/chat/manage', {
            method: 'POST',
            body: JSON.stringify({
                chat,
                title,
                action: 'title'
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Kick a member from chat
     * @param {string} chat - Chat ID
     * @param {string} member - Member
     */
    async kickMember(chat, member) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/chat/manage', {
            method: 'POST',
            body: JSON.stringify({
                chat,
                action: 'kickMember',
                member
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Promote someone
     * @param {string} chat - Chat ID
     * @param {string} member - Member
     */
    async promoteMember(chat, member) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/chat/manage', {
            method: 'POST',
            body: JSON.stringify({
                chat,
                action: 'promoteMember',
                member
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Demote someone
     * @param {string} chat - Chat ID
     * @param {string} member - Member
     */
    async demoteMember(chat, member) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/chat/manage', {
            method: 'POST',
            body: JSON.stringify({
                chat,
                action: 'demoteMember',
                member
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Invite someone to a chat
     * @param {string} chat - Chat ID
     * @param {string} member - Member
     */
    async inviteMember(chat, member) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/chat/manage', {
            method: 'POST',
            body: JSON.stringify({
                chat,
                action: 'invite',
                member
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Manage member rights
     * @param {string} chat - Chat ID
     * @param {'sendMessages'|'deleteMessages'|'manageGroup'|'manageAdmins'|'kickMembers'|'anonymous'|'admin'|'sendFiles'} member - Member
     */
    async editMemberRights(chat, member, right, value) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/chat/manage', {
            method: 'POST',
            body: JSON.stringify({
                chat,
                action: 'memberRights',
                member,
                right,
                value
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Set privacy to public
     * @param {string} chat - Chat ID
     */
    async setPublic(chat) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/chat/manage', {
            method: 'POST',
            body: JSON.stringify({
                chat,
                action: 'setPublic'
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Set privacy to private
     * @param {string} chat - Chat ID
     */
    async setPrivate(chat) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/chat/manage', {
            method: 'POST',
            body: JSON.stringify({
                chat,
                action: 'setPrivate'
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Clear invites list for private chats
     * @param {string} chat - Chat ID
     */
    async clearInvites(chat) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/chat/manage', {
            method: 'POST',
            body: JSON.stringify({
                chat,
                action: 'clearInvited'
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Enable AES encryption in a chat
     * @param {string} chat - Chat ID
     */
    async enableEncryption(chat) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/chat/manage', {
            method: 'POST',
            body: JSON.stringify({
                chat,
                action: 'enableEncryption'
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Send key for encryption
     * @param {string} chat - Chat ID
     */
    async sendKey(chat) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/chat/manage', {
            method: 'POST',
            body: JSON.stringify({
                chat,
                action: 'sendKey'
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Delete a message
     * @param {String} chat - Chat ID
     * @param {String} message - Message ID
     */
    async deleteMessage(chat, message) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/chat/deleteMessage', {
            method: 'POST',
            body: JSON.stringify({
                chat,
                id: message
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Join a chat
     * @param {String} chat - Chat ID
     */
    async join(chat) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/chat/join', {
            method: 'POST',
            body: JSON.stringify({
                chat
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Create a chat
     * @param {String} chat - Chat ID
     */
    async create(chat) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/chat/create', {
            method: 'POST',
            body: JSON.stringify({
                chat
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Leave a chat
     * @param {String} chat - Chat ID
     */
    async leave(chat) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/chat/leave', {
            method: 'POST',
            body: JSON.stringify({
                chat
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Get some data about user
     * @param {String} user - User name
     */
    async whoIs(user) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/whois', {
            method: 'POST',
            body: JSON.stringify({
                user
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Do some admin things
     * @param {Object} params - Params
     */
    async admin(params) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/admin', {
            method: 'POST',
            body: JSON.stringify(params),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result;
    }

    /**
     * Get mutual chats with a user
     * @param {String} user - User name
     */
    async mutualChats(user) {
        if (!this.token) throw new Error("Unauthorized");
        let f = await fetch(this.endpoint + '/api/v1/chat/mutual', {
            method: 'POST',
            body: JSON.stringify({
                user
            }),
            // mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
                'authorization': this.token
            }
        });
        let res = await f.json();
        if (!f.ok) throw new Error(res.error.en);
        return res.result.chats;
    }

    /**
     * Connect to WS
     */
    async connectWS() {
        if (!this.token) throw new Error("Unauthorized");
        const wsc = new WebSocket(this.wsUrl);
        console.log("Connecting to " + this.wsUrl);
        this.wsClosed = false;
        wsc.onopen = (event) => {
            this.emit('ws_open');
            console.warn("WS open");
            wsc.send(JSON.stringify({
                auth: true,
                token: this.token
            }));
            wsc.onmessage = (msg) => {
                this.emit('message', JSON.parse(msg.data));
            };
            wsc.onclose = (event) => {
                if (this.wsClosed) {
                    this.emit('ws_close');
                    console.log('WS close');
                } else {
                    this.ws.close();
                    console.warn("WS close");
                    setTimeout(() => {
                        console.warn("WS reconnecting");
                        this.connectWS();
                    }, 1000);
                }
            };
        };
        this.ws = wsc;
    }

    /**
     * Close WS
     */
    async closeWS() {
        this.wsClosed = true;
        this.ws.close();
    }
}

module.exports = {
    ApiChat,
    ApiChatMessage,
    Account,
    Client
};