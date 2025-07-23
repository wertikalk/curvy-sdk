//////////////////////////////////////////////////////////////////////////////
//
// GLOBAL FUNCTIONS - Must be added to the window object
//
//////////////////////////////////////////////////////////////////////////////

function showTabContent(tabId) {
    // Hide all tab content
    for (const tab of document.querySelectorAll(
        '.window[role="tabpanel"] > .window-body'
    )) {
        tab.style.visibility = "hidden";
        tab.style.display = "none";
    }
    // Set all tabs as inactive

    for (const tabItem of document.querySelectorAll("li[role='tab']")) {
        tabItem.setAttribute("aria-selected", "false");
    }

    // Show the active tab and set it as active
    document.getElementById(tabId).style.visibility = "visible";
    document.getElementById(tabId).style.removeProperty("display");

    for (const tab of document.querySelectorAll(`[data-tab-id="${tabId}"]`)) {
        tab.setAttribute("aria-selected", "true");
    }

    // Hide all sub tab content except the first one
    for (const tab of document.querySelectorAll(
        '.window[role="tabpanel"] > .window-body'
    )) {
        for (const [index, subTab] of document
            .querySelectorAll("div[role='sub-tab-content']")
            .entries()) {
            subTab.setAttribute("aria-selected", "false");
            subTab.style.visibility = "hidden";
            subTab.style.removeProperty("display");
            subTab.style.display = "none";
            if (index !== 0) continue;

            // Only the first sub tab should be visible
            subTab.style.visibility = "visible";
            subTab.setAttribute("aria-selected", "true");
            subTab.style.display = "block";
        }
    }
}

window.showTabContent = showTabContent;

function showSubTabContent(tabId, subTabId) {
    showTabContent(tabId);

    // Hide all sub tab content
    for (const tab of document.querySelectorAll(
        '.window[role="tabpanel"] > .window-body'
    )) {
        if (tab.id !== tabId) continue;
        // Set all sub tabs as inactive
        for (const subTab of document.querySelectorAll(
            "div[role='sub-tab-content']"
        )) {
            subTab.setAttribute("aria-selected", "false");
            subTab.style.visibility = "hidden";
            subTab.style.display = "none";

            if (subTab.id !== subTabId) continue;

            // Only the selected sub tab should be visible
            subTab.setAttribute("aria-selected", "true");
            subTab.style.visibility = "visible";
            subTab.style.display = "block";
        }
    }
}

window.showSubTabContent = showSubTabContent;

function addEventRow(eventType, data) {
    const tableBody = document.getElementById("eventsTable").tBodies[0];
    const newRow = tableBody.insertRow();

    const timestampCell = newRow.insertCell(0);
    const now = new Date(Date.now());
    const formattedTime = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
    timestampCell.textContent = formattedTime;

    const eventTypeCell = newRow.insertCell(1);
    eventTypeCell.textContent = eventType;

    const dataCell = newRow.insertCell(2);
    dataCell.textContent = data;
}

function openAddWalletWindow() {
    document.getElementById("register").style.display = "block";
}

window.openAddWalletWindow = openAddWalletWindow;

function closeAddWalletWindow() {
    document.getElementById("register").style.display = "none";
}
window.closeAddWalletWindow = closeAddWalletWindow;

function addAnnouncementRow(announcement) {
    const newTotalAnnouncements =
        Number.parseInt(
            document.getElementById("totalAnnouncements").textContent,
            10
        ) + 1;
    document.getElementById("totalAnnouncements").textContent =
        newTotalAnnouncements;
    const tableBody = document.getElementById("announcementsTable").tBodies[0];
    const newRow = tableBody.insertRow();

    if (!announcement) {
        return;
    }

    const idCell = newRow.insertCell(0);
    idCell.textContent = announcement.id;

    const createdAtCell = newRow.insertCell(1);
    createdAtCell.textContent = announcement.createdAt;

    const networkCell = newRow.insertCell(2);
    const network = window.curvySDK.GetNetworks(announcement.network_id);
    if (network[0]) {
        networkCell.textContent = network[0].name;
    }

    const viewTagCell = newRow.insertCell(3);
    viewTagCell.textContent = announcement.viewTag;
}

function getSDKConfiguration() {
    // Helper function to get the query parameters from the URL
    function getQueryParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    // Override the defaults with query parameters (if provided)
    const apiBaseUrl = getQueryParameter("apiBaseUrl");
    const apiKey = getQueryParameter("apiKey");
    const network = getQueryParameter("network") || "mainnets";

    return { apiKey, apiBaseUrl, network };
}

window.getSDKConfiguration = getSDKConfiguration;

function handleSDKConfigurationChange() {
    const apiUrl = document.getElementById("sdk-api-url").value;
    const apiKey = document.getElementById("sdk-api-key").value;
    const network = document.getElementById("sdk-network").value;

    const queryParams = new URLSearchParams({
        apiBaseUrl: apiUrl,
        apiKey: apiKey,
        network: network,
    }).toString();

    const currentUrl = new URL(window.location.href);
    currentUrl.search = queryParams;
    window.history.replaceState(null, "", currentUrl);
}

window.handleSDKConfigurationChange = handleSDKConfigurationChange;

function saveSDKConfiguration() {
    window.location.reload();
}

window.saveSDKConfiguration = saveSDKConfiguration;

async function signInWithMetamask() {
    document.body.style.cursor = "wait";

    if (!window.ethereum) {
        alert("Metamask not installed!");
        return;
    }

    const provider = window.ethereum;

    // Request account access
    const accounts = await provider.request({
        method: "eth_requestAccounts",
    });

    const ownerAddress = accounts[0];
    const password = await prompt("Please enter password");

    // Prompt eth_signTypedData
    const signingObject =
        await window.curvySDK.GetSignatureParamsForNetworkFlavour(
            "evm",
            ownerAddress,
            password
        );
    const params = [ownerAddress, signingObject];

    const rawSignature = await window.ethereum.request({
        method: "eth_signTypedData_v4",
        params,
    });

    await window.curvySDK.AddWalletWithSignature(ownerAddress, rawSignature);

    closeAddWalletWindow();
    populateWalletsTree();

    refreshBalances();

    document.body.style.cursor = "auto";
}

window.signInWithMetamask = signInWithMetamask;

async function signInWithStarknetWallet(walletName) {
    let wallet;
    if (walletName === "argent") {
        wallet = window.starknet_argentX;
    } else if (walletName === "braavos") {
        wallet = window.starknet_braavos;
    }

    if (wallet === undefined) {
        throw new Error(`Error connecting to Starknet wallet: ${walletName}`);
    }

    await wallet.enable();

    const ownerAddress = wallet.account.address;

    const password = await prompt("Please enter password");

    const signingObject =
        await window.curvySDK.GetSignatureParamsForNetworkFlavour(
            "starknet",
            ownerAddress,
            password
        );

    const signature = await wallet.account.signMessage(signingObject);

    await window.curvySDK.AddWalletWithSignature(ownerAddress, signature);

    closeAddWalletWindow();
    populateWalletsTree();
}

window.signInWithStarknetWallet = signInWithStarknetWallet;

// TOOD: Maybe this also in Curvy utils
function shortenAddress(address) {
    return `${address.slice(0, 8)}...${address.slice(-4)}`;
}

function populateWalletsTree() {
    let totalBalance = 0;
    const walletsTree = document.getElementById("wallets");
    const hideZeroBalances =
        document.getElementById("hideZeroBalances").checked;

    walletsTree.innerHTML = "";

    const wallets = window.curvySDK.GetWallets();

    if (wallets.length === 0) {
        walletsTree.innerHTML = `<li>
                                <img src="https://win98icons.alexmeub.com/icons/png/catalog_no-1.png" alt="No Wallets Icon"
                                     style="width: 12px; height: 12px; margin-right: 4px">
                                    <i>No wallets registered</i>
                            </li>`;
        return;
    }

    for (const wallet of window.curvySDK.GetWallets()) {
        // Create a new list item for `lazar.curvy.name`
        const listItem = document.createElement("li");
        const details = document.createElement("details");
        details.open = true;

        const summary = document.createElement("summary");
        summary.textContent =
            wallet.GetCurvyHandle() ||
            `(unregistered ${shortenAddress(wallet.GetOwnerAddress())})`;
        details.appendChild(summary);

        // --------------------------------------- Legacy CSA
        const legacyCSA = document.createElement("h5");
        legacyCSA.textContent = "Legacy:";
        details.appendChild(legacyCSA);

        let ul = document.createElement("ul");
        for (const stealthAddress of wallet.stealthAddresses) {
            const li = document.createElement("li");
            li.textContent = shortenAddress(stealthAddress.address);

            const balances = document.createElement("ul");

            for (const balanceIdentifier in stealthAddress.balances) {
                const [network, currency] =
                    window.curvySDK.GetNetworkAndCurrencyFromBalanceIdentifier(
                        balanceIdentifier
                    );

                const balance = document.createElement("li");

                balance.className = "balance";
                balance.setAttribute(
                    "onclick",
                    "selectStealthAddress.call(this)"
                );
                balance.dataset.address = stealthAddress.address;
                balance.dataset.network = network.name;
                balance.dataset.currency = currency.symbol;

                const formattedBalance = prettyPrintBalance(
                    stealthAddress.balances[balanceIdentifier],
                    currency.decimals
                );
                balance.textContent = `${formattedBalance} ${currency.symbol}@${network.name}`;
                balances.appendChild(balance);
                totalBalance += Number(formattedBalance) * currency.price;
            }

            if (
                !hideZeroBalances ||
                Object.keys(stealthAddress.balances).length > 0
            ) {
                ul.appendChild(li);
                ul.appendChild(balances);
                console.log(
                    "Stealth Address:",
                    stealthAddress.address,
                    "Private Key:",
                    stealthAddress.privateKey
                );
            }
        }
        details.appendChild(ul);

        // --------------------------------------- CSUC CSA

        const csucCSA = document.createElement("h5");
        csucCSA.textContent = "CSUC:";
        details.appendChild(csucCSA);

        ul = document.createElement("ul");
        for (const stealthAddress of wallet.stealthAddresses) {
            const li = document.createElement("li");
            li.textContent = shortenAddress(stealthAddress.address);

            const balances = document.createElement("ul");

            for (const balanceIdentifier in stealthAddress.csuc.balances) {
                const [network, currency] =
                    window.curvySDK.GetNetworkAndCurrencyFromBalanceIdentifier(
                        balanceIdentifier
                    );

                const balance = document.createElement("li");

                balance.className = "balance";
                balance.setAttribute(
                    "onclick",
                    "selectStealthAddress.call(this)"
                );
                balance.dataset.address = stealthAddress.address;
                balance.dataset.network = network.name;
                balance.dataset.currency = currency.symbol;

                const formattedBalance = prettyPrintBalance(
                    stealthAddress.csuc.balances[balanceIdentifier],
                    currency.decimals
                );
                balance.textContent = `${formattedBalance} ${currency.symbol}@${network.name}`;
                balances.appendChild(balance);
                totalBalance += Number(formattedBalance) * currency.price;
            }

            if (
                !hideZeroBalances ||
                Object.keys(stealthAddress.balances).length > 0
            ) {
                ul.appendChild(li);
                ul.appendChild(balances);
                console.log(
                    "CSUC::::",
                    "Stealth Address:",
                    stealthAddress.address,
                    "Private Key:",
                    stealthAddress.privateKey
                );
            }
        }

        details.appendChild(ul);

        // --------------------------------------- TODO: Aggregator

        listItem.appendChild(details);
        walletsTree.appendChild(listItem);
    }
    document.getElementById(
        "totalBalance"
    ).textContent = `$${totalBalance.toFixed(2)}`;
}

function selectStealthAddress() {
    const selectedBalances = document.querySelectorAll("li.balance.selected");

    for (const balance of selectedBalances) {
        balance.classList.remove("selected");
    }

    this.classList.add("selected");

    document.getElementById("estimate-fee").disabled = false;

    const address = this.dataset.address;
    const network = this.dataset.network;
    const currency = this.dataset.currency;

    const fromAddressInput = document.getElementById("fromAddress");
    fromAddressInput.value = address;

    const currencyInput = document.getElementById("currency");
    currencyInput.value = currency;

    const networkInput = document.getElementById("network");
    networkInput.value = network;

    const csucFromAddressInput = document.getElementById("csuc-fromAddress");
    csucFromAddressInput.value = address;

    const csucCurrencyInput = document.getElementById("csuc-currency");
    csucCurrencyInput.value = currency;

    const csucNetworkInput = document.getElementById("csuc-network");
    csucNetworkInput.value = network;
}

window.selectStealthAddress = selectStealthAddress;

// TODO: move to SDK
function prettyPrintBalance(amount, decimals, precision = 2) {
    if (typeof amount !== "bigint") {
        throw new TypeError("amount must be a BigInt");
    }

    const divisor = BigInt(10) ** BigInt(decimals);
    const whole = amount / divisor;
    const fraction = amount % divisor;

    // Get fractional part as string with padding
    let fractionStr = ((fraction * BigInt(10 ** precision)) / divisor)
        .toString()
        .padStart(precision, "0");

    // Trim trailing zeros from fractional part
    fractionStr = fractionStr.replace(/0+$/, "");

    return fractionStr.length > 0
        ? `${whole.toString()}.${fractionStr}`
        : whole.toString();
}

async function refreshBalances() {
    document.body.style.cursor = "wait";

    await window.curvySDK.RefreshBalances();
    await window.curvySDK.RefreshBalancesCSUC();

    populateWalletsTree();

    document.body.style.cursor = "auto";
}

window.refreshBalances = refreshBalances;

async function estimateFee() {
    // Disable when we start estimating
    document.getElementById("estimate-fee").disabled = true;
    document.body.style.cursor = "wait";

    const stealthAddress = window.curvySDK.GetStealthAddress(
        document.getElementById("fromAddress").value
    );

    const toAddress = document.getElementById("toAddress").value;
    const network = document.getElementById("network").value;
    const amount = document.getElementById("amount").value;
    const currency = document.getElementById("currency").value;

    const fee = await window.curvySDK.RPC.Network(network).EstimateFee(
        stealthAddress,
        toAddress,
        amount,
        currency
    );
    window.curvyEstimatedFee = fee;
    const feeAmount = window.curvySDK.RPC.Network(network).FeeToAmount(fee);

    const networkObj = window.curvySDK.GetNetwork(network);
    const { decimals } =
        window.curvySDK.GetNativeCurrencyForNetwork(networkObj);
    document.getElementById("fee").value = prettyPrintBalance(
        feeAmount,
        decimals,
        decimals
    );

    document.getElementById("estimate-fee").disabled = false;
    document.body.style.cursor = "auto";
    document.getElementById("send").disabled = false;
}

window.estimateFee = estimateFee;

async function send() {
    // Disable when we start estimating
    document.getElementById("estimate-fee").disabled = true;
    document.getElementById("send").disabled = true;
    document.body.style.cursor = "wait";

    const stealthAddress = window.curvySDK.GetStealthAddress(
        document.getElementById("fromAddress").value
    );

    const toAddress = document.getElementById("toAddress").value;
    const network = document.getElementById("network").value;
    const amount = document.getElementById("amount").value;
    const currency = document.getElementById("currency").value;

    const txHash = await window.curvySDK.Send(
        stealthAddress,
        network,
        toAddress,
        amount,
        currency,
        window.curvyEstimatedFee
    );

    document.getElementById("estimate-fee").disabled = false;
    document.body.style.cursor = "auto";

    const networkObj = await window.curvySDK.GetNetwork(network);
    window.open(`${networkObj.blockExplorerUrl}/tx/${txHash}`, "_blank");
    alert(`Transaction sent! Tx hash: ${txHash}`);
}

window.send = send;

async function transferIntoCSUC() {
    // Disable when we start estimating
    document.getElementById("csuc-transfer").disabled = true;
    document.body.style.cursor = "wait";

    const stealthAddress = window.curvySDK.GetStealthAddress(
        document.getElementById("csuc-fromAddress").value
    );

    const utils = await window.curvySDK.Utils();
    console.log("Utils: ", utils);

    const toAddress = document.getElementById("csuc-toAddress").value;
    let network = document.getElementById("csuc-network").value;
    network = network.replace(/\s+/g, "-").toLowerCase();
    let amount = document.getElementById("csuc-amount").value;
    amount = utils.EVM.parseDecimals(amount, 18);
    let currency = document.getElementById("csuc-currency").value;
    currency = utils.EVM.getTokenAddress(network, currency);

    console.log(
        `Transferring ${amount} ${currency} from ${stealthAddress} to ${toAddress} on ${network}`
    );

    const res = await window.curvySDK.TransferIntoCSUC(
        network,
        stealthAddress,
        toAddress,
        currency,
        amount
    );

    // alert(`Transaction sent! Tx hash: ${res}`);

    document.getElementById("csuc-transfer").disabled = false;
    document.body.style.cursor = "auto";
}

window.transferIntoCSUC = transferIntoCSUC;

async function getNewStealthAddress() {
    document.body.style.cursor = "wait";
    document.getElementById("get-new-stealth-address").disabled = true;
    document.getElementById("stealthAddress").value = "";

    const handle = document.getElementById("handle").value;
    const network = document.getElementById("networkForStealthAddress").value;

    const stealthAddress = await window.curvySDK.GetNewStealthAddressForUser(
        network,
        handle
    );
    document.getElementById("stealthAddress").value = stealthAddress;

    document.body.style.cursor = "auto";
    document.getElementById("get-new-stealth-address").disabled = false;
}

window.getNewStealthAddress = getNewStealthAddress;

//////////////////////////////////////////////////////////////////////////////
//
// SDK Initialization
//
//////////////////////////////////////////////////////////////////////////////

import { init } from "@0xcurvy/curvy-sdk";

window.addEventListener("DOMContentLoaded", () => {
    showTabContent("walletsTab");
});

const { apiKey, apiBaseUrl, network } = getSDKConfiguration();

const networkToNetworkFilterMapping = {
    testnets: true,
    mainnets: false,
};

let selectedNetworkFilter;

if (networkToNetworkFilterMapping[network] !== undefined) {
    selectedNetworkFilter = networkToNetworkFilterMapping[network];
} else {
    selectedNetworkFilter = network;
}

window.curvySDK = await init(
    {
        apiKey,
    },
    apiBaseUrl,
    selectedNetworkFilter
);

console.log("CURVY-OS SDK initialized", window.curvySDK);
console.log("Utils: ", await window.curvySDK.Utils());

// Get networks from the SDK
const networks = await window.curvySDK.GetNetworks();

// Populate the network dropdown
const networkSelect = document.getElementById("sdk-network");

// All Testnets
const testnetOption = document.createElement("option");
testnetOption.value = "testnets";
testnetOption.textContent = "All Testnets";
networkSelect.appendChild(testnetOption);

// All Mainnets
const mainnetOption = document.createElement("option");
mainnetOption.value = "mainnets";
mainnetOption.textContent = "All Mainnets";
networkSelect.appendChild(mainnetOption);

const networkForStealthAddressSelect = document.getElementById(
    "networkForStealthAddress"
);

if (networks && Array.isArray(networks)) {
    for (const network of networks) {
        const option = document.createElement("option");
        option.value = network.id;
        option.textContent = network.name;
        networkSelect.appendChild(option.cloneNode(true));
        networkForStealthAddressSelect.appendChild(option);
    }
}

// Update the input fields in the DOM (assuming they exist in the document)
document.getElementById("sdk-api-url").value = apiBaseUrl;
document.getElementById("sdk-api-key").value = apiKey;
document.getElementById("sdk-network").value = network;

window.curvySDK.onSyncStarted((event) => {
    addEventRow("SYNC_STARTED", JSON.stringify(event));
});

window.curvySDK.onSyncProgress((event) => {
    addEventRow(
        "SYNC_PROGRESS",
        JSON.stringify(event, ["synced", "remaining"])
    );

    for (const announcement of event.announcements) {
        addAnnouncementRow(announcement);
    }
});

window.curvySDK.onSyncComplete((event) => {
    addEventRow("SYNC_COMPLETE", JSON.stringify(event));
});

window.curvySDK.onScanProgress((event) => {
    addEventRow("SCAN_PROGRESS", JSON.stringify(event));
});

let totalMatched = 0;
window.curvySDK.onScanComplete((event) => {
    totalMatched += event.matched;
    document.getElementById("totalStealthAddresses").textContent = totalMatched;

    addEventRow("SCAN_COMPLETE", JSON.stringify(event));
});
