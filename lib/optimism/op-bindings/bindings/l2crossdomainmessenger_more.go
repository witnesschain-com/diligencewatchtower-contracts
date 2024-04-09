// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package bindings

import (
	"encoding/json"

	"github.com/ethereum-optimism/optimism/op-bindings/solc"
)

const L2CrossDomainMessengerStorageLayoutJSON = "{\"storage\":[{\"astId\":1000,\"contract\":\"contracts/L2/L2CrossDomainMessenger.sol:L2CrossDomainMessenger\",\"label\":\"spacer_0_0_20\",\"offset\":0,\"slot\":\"0\",\"type\":\"t_address\"},{\"astId\":1001,\"contract\":\"contracts/L2/L2CrossDomainMessenger.sol:L2CrossDomainMessenger\",\"label\":\"_initialized\",\"offset\":20,\"slot\":\"0\",\"type\":\"t_uint8\"},{\"astId\":1002,\"contract\":\"contracts/L2/L2CrossDomainMessenger.sol:L2CrossDomainMessenger\",\"label\":\"_initializing\",\"offset\":21,\"slot\":\"0\",\"type\":\"t_bool\"},{\"astId\":1003,\"contract\":\"contracts/L2/L2CrossDomainMessenger.sol:L2CrossDomainMessenger\",\"label\":\"spacer_1_0_1600\",\"offset\":0,\"slot\":\"1\",\"type\":\"t_array(t_uint256)50_storage\"},{\"astId\":1004,\"contract\":\"contracts/L2/L2CrossDomainMessenger.sol:L2CrossDomainMessenger\",\"label\":\"spacer_51_0_20\",\"offset\":0,\"slot\":\"51\",\"type\":\"t_address\"},{\"astId\":1005,\"contract\":\"contracts/L2/L2CrossDomainMessenger.sol:L2CrossDomainMessenger\",\"label\":\"spacer_52_0_1568\",\"offset\":0,\"slot\":\"52\",\"type\":\"t_array(t_uint256)49_storage\"},{\"astId\":1006,\"contract\":\"contracts/L2/L2CrossDomainMessenger.sol:L2CrossDomainMessenger\",\"label\":\"spacer_101_0_1\",\"offset\":0,\"slot\":\"101\",\"type\":\"t_bool\"},{\"astId\":1007,\"contract\":\"contracts/L2/L2CrossDomainMessenger.sol:L2CrossDomainMessenger\",\"label\":\"spacer_102_0_1568\",\"offset\":0,\"slot\":\"102\",\"type\":\"t_array(t_uint256)49_storage\"},{\"astId\":1008,\"contract\":\"contracts/L2/L2CrossDomainMessenger.sol:L2CrossDomainMessenger\",\"label\":\"spacer_151_0_32\",\"offset\":0,\"slot\":\"151\",\"type\":\"t_uint256\"},{\"astId\":1009,\"contract\":\"contracts/L2/L2CrossDomainMessenger.sol:L2CrossDomainMessenger\",\"label\":\"spacer_152_0_1568\",\"offset\":0,\"slot\":\"152\",\"type\":\"t_array(t_uint256)49_storage\"},{\"astId\":1010,\"contract\":\"contracts/L2/L2CrossDomainMessenger.sol:L2CrossDomainMessenger\",\"label\":\"spacer_201_0_32\",\"offset\":0,\"slot\":\"201\",\"type\":\"t_mapping(t_bytes32,t_bool)\"},{\"astId\":1011,\"contract\":\"contracts/L2/L2CrossDomainMessenger.sol:L2CrossDomainMessenger\",\"label\":\"spacer_202_0_32\",\"offset\":0,\"slot\":\"202\",\"type\":\"t_mapping(t_bytes32,t_bool)\"},{\"astId\":1012,\"contract\":\"contracts/L2/L2CrossDomainMessenger.sol:L2CrossDomainMessenger\",\"label\":\"successfulMessages\",\"offset\":0,\"slot\":\"203\",\"type\":\"t_mapping(t_bytes32,t_bool)\"},{\"astId\":1013,\"contract\":\"contracts/L2/L2CrossDomainMessenger.sol:L2CrossDomainMessenger\",\"label\":\"xDomainMsgSender\",\"offset\":0,\"slot\":\"204\",\"type\":\"t_address\"},{\"astId\":1014,\"contract\":\"contracts/L2/L2CrossDomainMessenger.sol:L2CrossDomainMessenger\",\"label\":\"msgNonce\",\"offset\":0,\"slot\":\"205\",\"type\":\"t_uint240\"},{\"astId\":1015,\"contract\":\"contracts/L2/L2CrossDomainMessenger.sol:L2CrossDomainMessenger\",\"label\":\"failedMessages\",\"offset\":0,\"slot\":\"206\",\"type\":\"t_mapping(t_bytes32,t_bool)\"},{\"astId\":1016,\"contract\":\"contracts/L2/L2CrossDomainMessenger.sol:L2CrossDomainMessenger\",\"label\":\"__gap\",\"offset\":0,\"slot\":\"207\",\"type\":\"t_array(t_uint256)42_storage\"}],\"types\":{\"t_address\":{\"encoding\":\"inplace\",\"label\":\"address\",\"numberOfBytes\":\"20\"},\"t_array(t_uint256)42_storage\":{\"encoding\":\"inplace\",\"label\":\"uint256[42]\",\"numberOfBytes\":\"1344\",\"base\":\"t_uint256\"},\"t_array(t_uint256)49_storage\":{\"encoding\":\"inplace\",\"label\":\"uint256[49]\",\"numberOfBytes\":\"1568\",\"base\":\"t_uint256\"},\"t_array(t_uint256)50_storage\":{\"encoding\":\"inplace\",\"label\":\"uint256[50]\",\"numberOfBytes\":\"1600\",\"base\":\"t_uint256\"},\"t_bool\":{\"encoding\":\"inplace\",\"label\":\"bool\",\"numberOfBytes\":\"1\"},\"t_bytes32\":{\"encoding\":\"inplace\",\"label\":\"bytes32\",\"numberOfBytes\":\"32\"},\"t_mapping(t_bytes32,t_bool)\":{\"encoding\":\"mapping\",\"label\":\"mapping(bytes32 =\u003e bool)\",\"numberOfBytes\":\"32\",\"key\":\"t_bytes32\",\"value\":\"t_bool\"},\"t_uint240\":{\"encoding\":\"inplace\",\"label\":\"uint240\",\"numberOfBytes\":\"30\"},\"t_uint256\":{\"encoding\":\"inplace\",\"label\":\"uint256\",\"numberOfBytes\":\"32\"},\"t_uint8\":{\"encoding\":\"inplace\",\"label\":\"uint8\",\"numberOfBytes\":\"1\"}}}"

var L2CrossDomainMessengerStorageLayout = new(solc.StorageLayout)

var L2CrossDomainMessengerDeployedBin = "0x6080604052600436106101445760003560e01c80638129fc1c116100c0578063a711986911610074578063b28ade2511610059578063b28ade251461036e578063d764ad0b1461038e578063ecc70428146103a157600080fd5b8063a71198691461030b578063b1b1b2091461033e57600080fd5b80638cbeeef2116100a55780638cbeeef2146101e35780639fce812c14610297578063a4e7f8bd146102cb57600080fd5b80638129fc1c1461026b57806383a740741461028057600080fd5b80633f827a5a1161011757806354fd4d50116100fc57806354fd4d50146101f95780635644cfdf1461021b5780636e296e451461023157600080fd5b80633f827a5a146101bb5780634c1d6a69146101e357600080fd5b8063028f85f7146101495780630c5684981461017c5780632828d7e8146101915780633dbb202b146101a6575b600080fd5b34801561015557600080fd5b5061015e601081565b60405167ffffffffffffffff90911681526020015b60405180910390f35b34801561018857600080fd5b5061015e603f81565b34801561019d57600080fd5b5061015e604081565b6101b96101b4366004611886565b610406565b005b3480156101c757600080fd5b506101d0600181565b60405161ffff9091168152602001610173565b3480156101ef57600080fd5b5061015e619c4081565b34801561020557600080fd5b5061020e61066a565b6040516101739190611965565b34801561022757600080fd5b5061015e61138881565b34801561023d57600080fd5b5061024661070d565b60405173ffffffffffffffffffffffffffffffffffffffff9091168152602001610173565b34801561027757600080fd5b506101b96107f9565b34801561028c57600080fd5b5061015e62030d4081565b3480156102a357600080fd5b506102467f000000000000000000000000000000000000000000000000000000000000000081565b3480156102d757600080fd5b506102fb6102e636600461197f565b60ce6020526000908152604090205460ff1681565b6040519015158152602001610173565b34801561031757600080fd5b507f0000000000000000000000000000000000000000000000000000000000000000610246565b34801561034a57600080fd5b506102fb61035936600461197f565b60cb6020526000908152604090205460ff1681565b34801561037a57600080fd5b5061015e610389366004611998565b6109f6565b6101b961039c3660046119ec565b610a64565b3480156103ad57600080fd5b506103f860cd547dffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff167e010000000000000000000000000000000000000000000000000000000000001790565b604051908152602001610173565b61053f7f00000000000000000000000000000000000000000000000000000000000000006104358585856109f6565b347fd764ad0b000000000000000000000000000000000000000000000000000000006104a160cd547dffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff167e010000000000000000000000000000000000000000000000000000000000001790565b338a34898c8c6040516024016104bd9796959493929190611ab7565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff000000000000000000000000000000000000000000000000000000009093169290921790915261135d565b8373ffffffffffffffffffffffffffffffffffffffff167fcb0f7ffd78f9aee47a248fae8db181db6eee833039123e026dcbff529522e52a3385856105c460cd547dffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff167e010000000000000000000000000000000000000000000000000000000000001790565b866040516105d6959493929190611b16565b60405180910390a260405134815233907f8ebb2ec2465bdb2a06a66fc37a0963af8a2a6a1479d81d56fdb8cbb98096d5469060200160405180910390a2505060cd80547dffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff808216600101167fffff0000000000000000000000000000000000000000000000000000000000009091161790555050565b60606106957f00000000000000000000000000000000000000000000000000000000000000006113eb565b6106be7f00000000000000000000000000000000000000000000000000000000000000006113eb565b6106e77f00000000000000000000000000000000000000000000000000000000000000006113eb565b6040516020016106f993929190611b64565b604051602081830303815290604052905090565b60cc5460009073ffffffffffffffffffffffffffffffffffffffff167fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff2153016107dc576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152603560248201527f43726f7373446f6d61696e4d657373656e6765723a2078446f6d61696e4d657360448201527f7361676553656e646572206973206e6f7420736574000000000000000000000060648201526084015b60405180910390fd5b5060cc5473ffffffffffffffffffffffffffffffffffffffff1690565b6000547501000000000000000000000000000000000000000000900460ff1615808015610844575060005460017401000000000000000000000000000000000000000090910460ff16105b806108765750303b158015610876575060005474010000000000000000000000000000000000000000900460ff166001145b610902576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201527f647920696e697469616c697a656400000000000000000000000000000000000060648201526084016107d3565b600080547fffffffffffffffffffffff00ffffffffffffffffffffffffffffffffffffffff1674010000000000000000000000000000000000000000179055801561098857600080547fffffffffffffffffffff00ffffffffffffffffffffffffffffffffffffffffff1675010000000000000000000000000000000000000000001790555b610990611520565b80156109f357600080547fffffffffffffffffffff00ffffffffffffffffffffffffffffffffffffffffff169055604051600181527f7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb38474024989060200160405180910390a15b50565b6000611388619c4080603f610a12604063ffffffff8816611c09565b610a1c9190611c68565b610a27601088611c09565b610a349062030d40611c8f565b610a3e9190611c8f565b610a489190611c8f565b610a529190611c8f565b610a5c9190611c8f565b949350505050565b60f087901c60028110610b1f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152604d60248201527f43726f7373446f6d61696e4d657373656e6765723a206f6e6c7920766572736960448201527f6f6e2030206f722031206d657373616765732061726520737570706f7274656460648201527f20617420746869732074696d6500000000000000000000000000000000000000608482015260a4016107d3565b8061ffff16600003610c14576000610b70878986868080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152508f92506115f9915050565b600081815260cb602052604090205490915060ff1615610c12576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152603760248201527f43726f7373446f6d61696e4d657373656e6765723a206c65676163792077697460448201527f6864726177616c20616c72656164792072656c6179656400000000000000000060648201526084016107d3565b505b6000610c5a898989898989898080601f01602080910402602001604051908101604052809392919081815260200183838082843760009201919091525061161892505050565b905073ffffffffffffffffffffffffffffffffffffffff7fffffffffffffffffffffffffeeeeffffffffffffffffffffffffffffffffeeef330181167f000000000000000000000000000000000000000000000000000000000000000090911603610cf257853414610cce57610cce611cbb565b600081815260ce602052604090205460ff1615610ced57610ced611cbb565b610e44565b3415610da6576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152605060248201527f43726f7373446f6d61696e4d657373656e6765723a2076616c7565206d75737460448201527f206265207a65726f20756e6c657373206d6573736167652069732066726f6d2060648201527f612073797374656d206164647265737300000000000000000000000000000000608482015260a4016107d3565b600081815260ce602052604090205460ff16610e44576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152603060248201527f43726f7373446f6d61696e4d657373656e6765723a206d65737361676520636160448201527f6e6e6f74206265207265706c617965640000000000000000000000000000000060648201526084016107d3565b610e4d8761163b565b15610f00576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152604360248201527f43726f7373446f6d61696e4d657373656e6765723a2063616e6e6f742073656e60448201527f64206d65737361676520746f20626c6f636b65642073797374656d206164647260648201527f6573730000000000000000000000000000000000000000000000000000000000608482015260a4016107d3565b600081815260cb602052604090205460ff1615610f9f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152603660248201527f43726f7373446f6d61696e4d657373656e6765723a206d65737361676520686160448201527f7320616c7265616479206265656e2072656c617965640000000000000000000060648201526084016107d3565b610fc085610fb1611388619c40611c8f565b67ffffffffffffffff16611690565b1580610fe6575060cc5473ffffffffffffffffffffffffffffffffffffffff1661dead14155b156110ff57600081815260ce602052604080822080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff001660011790555182917f99d0e048484baa1b1540b1367cb128acd7ab2946d1ed91ec10e3c85e4bf51b8f91a27fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff32016110f8576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602d60248201527f43726f7373446f6d61696e4d657373656e6765723a206661696c656420746f2060448201527f72656c6179206d6573736167650000000000000000000000000000000000000060648201526084016107d3565b5050611338565b60cc80547fffffffffffffffffffffffff00000000000000000000000000000000000000001673ffffffffffffffffffffffffffffffffffffffff8a16179055600061119088619c405a6111539190611cea565b8988888080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152506116ae92505050565b60cc80547fffffffffffffffffffffffff00000000000000000000000000000000000000001661dead1790559050801561122757600082815260cb602052604080822080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff001660011790555183917f4641df4a962071e12719d8c8c8e5ac7fc4d97b927346a3d7a335b1f7517e133c91a2611334565b600082815260ce602052604080822080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff001660011790555183917f99d0e048484baa1b1540b1367cb128acd7ab2946d1ed91ec10e3c85e4bf51b8f91a27fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff3201611334576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602d60248201527f43726f7373446f6d61696e4d657373656e6765723a206661696c656420746f2060448201527f72656c6179206d6573736167650000000000000000000000000000000000000060648201526084016107d3565b5050505b50505050505050565b73ffffffffffffffffffffffffffffffffffffffff163b151590565b6040517fc2b3e5ac0000000000000000000000000000000000000000000000000000000081527342000000000000000000000000000000000000169063c2b3e5ac9084906113b390889088908790600401611d01565b6000604051808303818588803b1580156113cc57600080fd5b505af11580156113e0573d6000803e3d6000fd5b505050505050505050565b60608160000361142e57505060408051808201909152600181527f3000000000000000000000000000000000000000000000000000000000000000602082015290565b8160005b8115611458578061144281611d49565b91506114519050600a83611d81565b9150611432565b60008167ffffffffffffffff81111561147357611473611d95565b6040519080825280601f01601f19166020018201604052801561149d576020820181803683370190505b5090505b8415610a5c576114b2600183611cea565b91506114bf600a86611dc4565b6114ca906030611dd8565b60f81b8183815181106114df576114df611df0565b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a905350611519600a86611d81565b94506114a1565b6000547501000000000000000000000000000000000000000000900460ff166115cb576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152602b60248201527f496e697469616c697a61626c653a20636f6e7472616374206973206e6f74206960448201527f6e697469616c697a696e6700000000000000000000000000000000000000000060648201526084016107d3565b60cc80547fffffffffffffffffffffffff00000000000000000000000000000000000000001661dead179055565b6000611607858585856116c8565b805190602001209050949350505050565b6000611628878787878787611761565b8051906020012090509695505050505050565b600073ffffffffffffffffffffffffffffffffffffffff821630148061168a575073ffffffffffffffffffffffffffffffffffffffff8216734200000000000000000000000000000000000016145b92915050565b600080603f83619c4001026040850201603f5a021015949350505050565b600080600080845160208601878a8af19695505050505050565b6060848484846040516024016116e19493929190611e1f565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fcbd4ece9000000000000000000000000000000000000000000000000000000001790529050949350505050565b606086868686868660405160240161177e96959493929190611e69565b604080517fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe08184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fd764ad0b0000000000000000000000000000000000000000000000000000000017905290509695505050505050565b803573ffffffffffffffffffffffffffffffffffffffff8116811461182457600080fd5b919050565b60008083601f84011261183b57600080fd5b50813567ffffffffffffffff81111561185357600080fd5b60208301915083602082850101111561186b57600080fd5b9250929050565b803563ffffffff8116811461182457600080fd5b6000806000806060858703121561189c57600080fd5b6118a585611800565b9350602085013567ffffffffffffffff8111156118c157600080fd5b6118cd87828801611829565b90945092506118e0905060408601611872565b905092959194509250565b60005b838110156119065781810151838201526020016118ee565b83811115611915576000848401525b50505050565b600081518084526119338160208601602086016118eb565b601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169290920160200192915050565b602081526000611978602083018461191b565b9392505050565b60006020828403121561199157600080fd5b5035919050565b6000806000604084860312156119ad57600080fd5b833567ffffffffffffffff8111156119c457600080fd5b6119d086828701611829565b90945092506119e3905060208501611872565b90509250925092565b600080600080600080600060c0888a031215611a0757600080fd5b87359650611a1760208901611800565b9550611a2560408901611800565b9450606088013593506080880135925060a088013567ffffffffffffffff811115611a4f57600080fd5b611a5b8a828b01611829565b989b979a50959850939692959293505050565b8183528181602085013750600060208284010152600060207fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f840116840101905092915050565b878152600073ffffffffffffffffffffffffffffffffffffffff808916602084015280881660408401525085606083015263ffffffff8516608083015260c060a0830152611b0960c083018486611a6e565b9998505050505050505050565b73ffffffffffffffffffffffffffffffffffffffff86168152608060208201526000611b46608083018688611a6e565b905083604083015263ffffffff831660608301529695505050505050565b60008451611b768184602089016118eb565b80830190507f2e000000000000000000000000000000000000000000000000000000000000008082528551611bb2816001850160208a016118eb565b60019201918201528351611bcd8160028401602088016118eb565b0160020195945050505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600067ffffffffffffffff80831681851681830481118215151615611c3057611c30611bda565b02949350505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601260045260246000fd5b600067ffffffffffffffff80841680611c8357611c83611c39565b92169190910492915050565b600067ffffffffffffffff808316818516808303821115611cb257611cb2611bda565b01949350505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052600160045260246000fd5b600082821015611cfc57611cfc611bda565b500390565b73ffffffffffffffffffffffffffffffffffffffff8416815267ffffffffffffffff83166020820152606060408201526000611d40606083018461191b565b95945050505050565b60007fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8203611d7a57611d7a611bda565b5060010190565b600082611d9057611d90611c39565b500490565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600082611dd357611dd3611c39565b500690565b60008219821115611deb57611deb611bda565b500190565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b600073ffffffffffffffffffffffffffffffffffffffff808716835280861660208401525060806040830152611e58608083018561191b565b905082606083015295945050505050565b868152600073ffffffffffffffffffffffffffffffffffffffff808816602084015280871660408401525084606083015283608083015260c060a0830152611eb460c083018461191b565b9897505050505050505056fea164736f6c634300080f000a"

func init() {
	if err := json.Unmarshal([]byte(L2CrossDomainMessengerStorageLayoutJSON), L2CrossDomainMessengerStorageLayout); err != nil {
		panic(err)
	}

	layouts["L2CrossDomainMessenger"] = L2CrossDomainMessengerStorageLayout
	deployedBytecodes["L2CrossDomainMessenger"] = L2CrossDomainMessengerDeployedBin
}
