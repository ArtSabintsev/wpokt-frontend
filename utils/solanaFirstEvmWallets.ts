import type { Chain, Wallet } from '@rainbow-me/rainbowkit';
import type { WindowProvider } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';

class NamespacedInjectedConnector extends InjectedConnector {
  readonly id: string;
  readonly name: string;
  constructor({
    id,
    name,
    chains,
    getProvider,
  }: {
    id: string;
    name: string;
    chains: Chain[];
    getProvider: () => WindowProvider | undefined;
  }) {
    super({ chains, options: { name, shimDisconnect: true, getProvider } });
    this.id = id;
    this.name = name;
    // wagmi v1 keys injected-wallet disconnect state by connector id.
    this.shimDisconnectKey = `${id}.shimDisconnect`;
  }
}

type EthereumProvider = WindowProvider & {
  isPhantom?: boolean;
  isBackpack?: boolean;
  isOkxWallet?: boolean;
  isOKExWallet?: boolean;
  isBitKeep?: boolean;
  isBitKeepChrome?: boolean;
  isMagicEden?: boolean;
  providers?: EthereumProvider[];
};

type WindowWithWallets = Window & {
  phantom?: { ethereum?: EthereumProvider };
  backpack?: { ethereum?: EthereumProvider };
  okxwallet?: EthereumProvider;
  bitkeep?: { ethereum?: EthereumProvider };
  magicEden?: { ethereum?: EthereumProvider };
  ethereum?: EthereumProvider & { providers?: EthereumProvider[] };
};

function getWalletWindow(): WindowWithWallets | undefined {
  if (typeof window === 'undefined') return undefined;
  return window as WindowWithWallets;
}

function pickProvider(predicate: (p: EthereumProvider) => boolean): EthereumProvider | undefined {
  const root = getWalletWindow()?.ethereum;
  if (root?.providers?.length) {
    const match = root.providers.find(predicate);
    if (match) return match;
  }
  if (root && predicate(root)) return root;
  return undefined;
}

function getPhantomProvider(): EthereumProvider | undefined {
  return getWalletWindow()?.phantom?.ethereum ?? pickProvider((p) => !!p.isPhantom);
}

function getBackpackProvider(): EthereumProvider | undefined {
  return getWalletWindow()?.backpack?.ethereum ?? pickProvider((p) => !!p.isBackpack);
}

function getOkxProvider(): EthereumProvider | undefined {
  return getWalletWindow()?.okxwallet ?? pickProvider((p) => !!p.isOkxWallet || !!p.isOKExWallet);
}

function getBitgetProvider(): EthereumProvider | undefined {
  return getWalletWindow()?.bitkeep?.ethereum ?? pickProvider((p) => !!p.isBitKeep || !!p.isBitKeepChrome);
}

function getMagicEdenProvider(): EthereumProvider | undefined {
  return getWalletWindow()?.magicEden?.ethereum ?? pickProvider((p) => !!p.isMagicEden);
}

type WalletFactory = (params: { chains: Chain[] }) => Wallet;
type WalletDefinition = Omit<Wallet, 'createConnector' | 'installed'> & {
  getProvider: () => EthereumProvider | undefined;
};

function createInjectedWallet({
  getProvider,
  ...wallet
}: WalletDefinition): WalletFactory {
  return ({ chains }) => ({
    ...wallet,
    installed: getProvider() ? true : undefined,
    createConnector: () => ({
      connector: new NamespacedInjectedConnector({
        id: wallet.id,
        name: wallet.name,
        chains,
        getProvider,
      }),
    }),
  });
}

export const phantomWallet = createInjectedWallet({
  id: 'phantom',
  name: 'Phantom',
  iconUrl: '/wallets/phantom.svg',
  iconBackground: '#9A8AEE',
  downloadUrls: {
    browserExtension: 'https://phantom.app/download',
    chrome: 'https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa',
    firefox: 'https://addons.mozilla.org/en-US/firefox/addon/phantom-app/',
    ios: 'https://apps.apple.com/app/phantom-solana-wallet/1598432977',
    android: 'https://play.google.com/store/apps/details?id=app.phantom',
  },
  getProvider: getPhantomProvider,
});

export const backpackWallet = createInjectedWallet({
  id: 'backpack',
  name: 'Backpack',
  iconUrl: '/wallets/backpack.svg',
  iconBackground: '#ffffff',
  downloadUrls: {
    browserExtension: 'https://backpack.app/downloads',
    chrome: 'https://chrome.google.com/webstore/detail/backpack/aflkmfhebedbjioipglgcbcmnbpgliof',
  },
  getProvider: getBackpackProvider,
});

export const okxWallet = createInjectedWallet({
  id: 'okx',
  name: 'OKX Wallet',
  iconUrl: '/wallets/okx.svg',
  iconBackground: '#000000',
  downloadUrls: {
    browserExtension: 'https://www.okx.com/web3',
    chrome: 'https://chrome.google.com/webstore/detail/okx-wallet/mcohilncbfahbmgdjkbpemcciiolgcge',
    ios: 'https://apps.apple.com/app/okx-buy-bitcoin-eth-crypto/id1327268470',
    android: 'https://play.google.com/store/apps/details?id=com.okinc.okex.gp',
  },
  getProvider: getOkxProvider,
});

export const bitgetWallet = createInjectedWallet({
  id: 'bitget',
  name: 'Bitget Wallet',
  iconUrl: '/wallets/bitget.svg',
  iconBackground: '#000000',
  downloadUrls: {
    browserExtension: 'https://web3.bitget.com/en/wallet-download',
    chrome: 'https://chrome.google.com/webstore/detail/bitkeep-crypto-nft-wallet/jiidiaalihmmhddjgbnbgdfflelocpak',
    ios: 'https://apps.apple.com/app/bitkeep/id1395301115',
    android: 'https://play.google.com/store/apps/details?id=com.bitkeep.wallet',
  },
  getProvider: getBitgetProvider,
});

export const magicEdenWallet = createInjectedWallet({
  id: 'magicEden',
  name: 'Magic Eden Wallet',
  iconUrl: '/wallets/magicEden.svg',
  iconBackground: '#36114D',
  downloadUrls: {
    browserExtension: 'https://wallet.magiceden.io/',
    chrome: 'https://chromewebstore.google.com/detail/magic-eden-wallet/mkpegjkblkkefacfnmkajcjmabijhclg',
  },
  getProvider: getMagicEdenProvider,
});
