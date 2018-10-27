pragma solidity ^0.4.24;
contract Hospital {
    
    address public ownerAddress;
    string public name;
    address[] public sxaminations;
    
    event PatientCreated(address patientAddress);
    
    constructor(string _name) public {
        name = _name;
        ownerAddress = msg.sender;
    }
    
    function createPatient(string _name, address _personAddress) external {
        require (msg.sender == ownerAddress, "Only Administrator can call this.");
        address addrPatient = new Patient(_name, _personAddress);
        emit PatientCreated(addrPatient);
    }
    
}

contract Examination {
    
    enum States { Pendding, Finished }
    address public hospitalAddress;
    address public patientAddress;
    
    string public name;
    string public result;
    uint public cost;
    States public state;
    
    constructor(string _name, string _result, uint _cost, address _hospitalAddress, address _patientAddress) public {
        name = _name;
        result = _result;
        cost = _cost;
        hospitalAddress = _hospitalAddress;
        patientAddress = _patientAddress;
        state = States.Pendding;
    }
}

contract Patient {
    address onwerAddress;
    string public name;
    address[] public sxaminations;
    
    constructor(string _name, address _ownerAddress) public {
        name = _name;
        onwerAddress = _ownerAddress;
    }
}

