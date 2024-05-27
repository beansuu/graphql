import {makeGraph} from "/ProjectsChartXP.js";
import {renderDonutChart} from "/auditsChart.js";
import {showErrorNotification} from "/notifications.js";

let username = "";
let password = "";
let logoutDiv = document.getElementById("logoutDiv");
const app = document.getElementById("app");

function init() {
    localStorage.clear();
    if (localStorage.loggedIn != "true") {
        loginPage();
    }
}

function loginPage() {
    app.style.display = "none";
    const loginDiv = document.getElementById("loginDiv");
    loginDiv.className = "login";

    const loginHeader = createElement("h1", "title", "GraphQL");
    const loginForm = createElement("form");
    loginForm.id = 'loginForm';

    const loginUser = createInput("username", "text", "Username or email");
    const loginPw = createInput("password", "password", "Password");

    const submitButton = createElement("button", null, "Login");
    submitButton.type = "submit";

    appendChildren(loginForm, [loginUser, loginPw, submitButton]);
    appendChildren(loginDiv, [loginHeader, loginForm]);

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        auth();
    });
}

function createElement(type, className, textContent) {
    const element = document.createElement(type);
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    return element;
}

function createInput(id, type, placeholder) {
    const input = createElement("input", "input");
    input.id = id;
    input.name = id;
    input.type = type;
    input.placeholder = placeholder;
    input.required = true;
    return input;
}

function appendChildren(parent, children) {
    children.forEach(child => parent.appendChild(child));
}

async function auth() {
    username = document.getElementById("username").value;
    password = document.getElementById("password").value;
    let data = btoa(`${username}:${password}`);
    let response = await fetch("https://01.kood.tech/api/auth/signin", {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${data}`
        }
    });
    let JWToken = await response.json();
    if (response.status == "401" || response.status == "403") {
        showErrorNotification("Incorrect username or password");
        return;
    }
    if (response.ok) {
        localStorage.setItem('JWToken', JWToken);
        localStorage.setItem('loggedIn', true);
        document.getElementById("loginDiv").style.display = "none";
        document.getElementById("donutChartContainer").style.display = "";
        document.getElementById("tasksGraph").style.display = "";
        index();
        createHeader(username);
        displayGraphs(JWToken);
    }
}

function logout() {
    localStorage.clear();
    document.getElementById("tasksGraph").style.display = "none";
    window.location.replace("/");
}

async function index() {
    logoutDiv.style.display = "";
    app.style.display = "";

    let data = "";
    let token = localStorage.getItem('JWToken');
    try {
        let response = await fetch('https://01.kood.tech/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: `
            {user {
                id
                login
                attrs
                transactions(order_by: {createdAt: desc}){
                    id
                    type
                    amount
                    createdAt
                    path
                }
            }
        }
            `
            })

        });
        data = await response.json();

    } catch (error) {
        console.log(error);
        localStorage.clear();
    }

    console.log(data);
    display(data);
}

function display(data) {
    const userInfoDiv = createElement("div", "userInfo");
    const header = createElement("h2", "userInfoHeader", "User Information");

    userInfoDiv.appendChild(header);
    userInfoDiv.appendChild(displayInfo(data.data.user[0]));
    userInfoDiv.appendChild(displayProgression(data.data.user[0].transactions));
    userInfoContainer.appendChild(userInfoDiv);
}


function displayInfo(user) {
    let infoDiv = document.createElement("div");
    infoDiv.className = "infoDiv";
    let username = createElement("div", "userData", "Username: " + user.login);
    let userID = createElement("div", "userData", "UserID: " + user.id);
    let firstName = createElement("div", "userData", "First name: " + user.attrs.firstName);
    let lastName = createElement("div", "userData", "Last name: " + user.attrs.lastName);
    let email = createElement("div", "userData", "E-mail: " + user.attrs.email);
    let phoneNumber = createElement("div", "userData", "Telly nummer: " + user.attrs.tel);

    infoDiv.appendChild(username);
    infoDiv.appendChild(userID);
    infoDiv.appendChild(firstName);
    infoDiv.appendChild(lastName);
    infoDiv.appendChild(email);
    infoDiv.appendChild(phoneNumber);

    return infoDiv;
}

function displayProgression(data) {
    data.reverse();

    let level = 0, xp = 0, up = 0, down = 0;
    for (let i = 0; i < data.length; i++) {
        if (!data[i].path.includes('piscine')) {
            switch (data[i].type) {
                case 'xp':
                    xp += data[i].amount;
                    break;
                case 'level':
                    level = data[i].amount;
                    break;
                case 'up':
                    up += data[i].amount;
                    break;
                case 'down':
                    down += data[i].amount;
                    break;
            }
        }
    }

    let xpDiv = createElement("div", "xp", "Total XP: " + formatXP(xp, 2));
    let levelDiv = createElement("div", "level", "Level : " + level);

    let progressionDiv = createElement("div", "progressionDiv");
    progressionDiv.appendChild(xpDiv);
    progressionDiv.appendChild(levelDiv);
    renderDonutChart(up, down);
    return progressionDiv;
}

export function formatXP(bits, decimals = 2) {
    if (!+bits) return '0 Bits';

    const bit = 1000;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bits', 'KiB', 'MiB', 'GiB'];
    const i = Math.floor(Math.log(bits) / Math.log(bit));
    return `${parseFloat((bits / Math.pow(bit, i)).toFixed(dm))} ${sizes[i]}`;

}


function displayGraphs(JWToken) {
    const headers = {
        "Content-type": "application/json",
        Authorization: `Bearer ${JWToken}`,
    };
    setupProjectsGraph(headers);
}

async function setupProjectsGraph(headers) {
    const transactions = await getTransactions(headers);
    makeGraph(transactions);
}

async function getTransactions(headers) {
    const userQuery = `
    {
            transaction {
            amount
            type
            path
            }
        }
    `;


    const requestOptions = {
        method: "POST",
        headers: headers,
        body: JSON.stringify({query: userQuery}),
    };

    const apiResponse = await fetch("https://01.kood.tech/api/graphql-engine/v1/graphql", requestOptions);
    const apiData = await apiResponse.json();
    const transactions = apiData.data.transaction;
    return transactions;
}

function createHeader(username) {
    const header = createElement("div", "header");
    const title = createElement("div", "title", "GraphQL");
    const welcomeContainer = createElement("div", "welcome-container");
    const welcome = createElement("div", "welcome", `Welcome, ${username}`);
    const logoutBtn = document.getElementById("logoutButton");

    welcomeContainer.appendChild(welcome);
    welcomeContainer.appendChild(logoutBtn);
    header.appendChild(title);
    header.appendChild(welcomeContainer);

    document.body.insertBefore(header, document.body.firstChild);
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
});