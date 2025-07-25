export const platform = () => {
    const ensureSetup = (chainId: string) => {



        const proc = await ensureServerRunning();

        const wallet = await createNewAccount('Test Account ' + new Date().getTime());

        const accounts = await testAccounts();
        // const chainId = 'erc3643-chain-' + new Date().getTime()
        const chainId = 'erc3643-test-chain'

        const trex = await deployTrexSuite(chainId, accounts);
        console.log('trex', trex);
    }
}