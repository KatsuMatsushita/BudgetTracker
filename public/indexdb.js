// this copies code from class activities to this js file
// the code in class was placed in the index.html; we are putting it into this file

// create a global variable for containing the 
let db;

//assigns an indexedDB called "budget" to request
const request = indexedDB.open("budget", 1);

// if the indexedDB doesn't already exist, create the objectstore
// set the name of the ObjectStore to "pending" and autoIncrement to true
request.onupgradeneeded = ({ target }) => {
    let db = target.result;
    db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = ({ target }) => {
    // when the indexedDB is successfully opened, run this
    // global variable db is made to be the target of the request
    // db becomes the indexedDB
    db = target.result;
    // check if the app is online
    // if online, then loadDatabase
    if (navigator.onLine) {
        loadDatabase();
    }
};

request.onerror = (evt) => {
    console.log("ERROR when loading indexedDB: " + evt.target.errorCode);
};

function saveRecord(pendTrans) {
    // this is a function called from index.js
    // this is to insert a pending transaction into the objectStore when the app is offline
    const transaction = db.transaction(["pending"], "readwrite");
    const store = transaction.objectStore("pending");
    store.add(pendTrans);
}

function loadDatabase() {
    const transaction = db.transaction(["pending"], "readwrite");
    const store = transaction.objectStore("pending");
    const getAll = store.getAll();

    // when the store.getAll() is successful, then run this function
    getAll.onsuccess = () => {
        if(getAll.result.length > 0) {
            // if there are pending transactions in the indexedDB
            // call the /api/transaction/bulk to load all pending transactions to the db
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                  Accept: "application/json, text/plain, */*",
                  "Content-Type": "application/json"
                }
              })
              .then(response => {
                  // return the response from /api/transaction/bulk
                  return response.json();
              })
              .then( () => {
                  // clears out the indexedDB of the pending transactions
                  const transaction = db.transaction(["pending"], "readwrite");
                  const store = transaction.objectStore("pending");
                  store.clear();
              });
        }
    };
};

// listen for when the app is online again and load the database with pending transactions
window.addEventListener("online", loadDatabase);