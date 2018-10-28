pragma solidity ^0.4.24;
contract Hospital {
    
    address public ownerAddress;
    string public name;
    address[] public examinations;
    
    event PatientCreated(address patientAddress);
    event ExaminationCreated(address examinationAddress);
    event PayExamination(address examinationAddress);
    event HasResultExamination(address examinationAddress);
    
    constructor(string _name) public {
        name = _name;
        ownerAddress = msg.sender;
    }
    
    function createPatient(string _name, address _personAddress) external {
        require (msg.sender == ownerAddress, "Only Hospital onwer can call this.");
        address addrPatient = new Patient(_name, _personAddress);
        emit PatientCreated(addrPatient);
    }
    
    function createExamination(string _name, uint _cost, address _patientAddress) external {
        require (msg.sender == ownerAddress, "Only Hospital onwer can call this.");
        address addrExamination = new Examination(_name, _cost, this, _patientAddress);
        Patient patient = Patient(_patientAddress);
        patient.addExamination(addrExamination);
        examinations.push(addrExamination);
        emit ExaminationCreated(addrExamination);
    }
    
    function payExamination(address _examinationAddr) payable external {
        Examination examination = Examination(_examinationAddr);
        examination.updateState(Examination.States.Paid);
        emit PayExamination(_examinationAddr);
    }

    
    function writeResultExamination(address _examinationAddr, string _result) external {
        Examination examination = Examination(_examinationAddr);
        require(examination.state() != Examination.States.Finished, "Examination is finished");
        require(examination.state() == Examination.States.Paid, "Examination is not paid yet");
        examination.updateResult(_result);
        examination.updateState(Examination.States.Finished);
        emit HasResultExamination(_examinationAddr);
    }
    
}

contract Examination {
    
    enum States { Pendding, Paid, Finished }
    address public hospitalAddress;
    address public patientAddress;
    
    string public name;
    string public result;
    uint public cost;
    uint public dateCreated;
    States public state;
    
    constructor(string _name, uint _cost, address _hospitalAddress, address _patientAddress) public {
        name = _name;
        cost = _cost;
        hospitalAddress = _hospitalAddress;
        patientAddress = _patientAddress;
        state = States.Pendding;
        dateCreated = now;
    }
    
    function updateState(States _newState) public {
        require (msg.sender == hospitalAddress, "Only Hospital can update status");
        state = _newState;
    }
    
    function updateResult(string _newResult) public {
        require (msg.sender == hospitalAddress, "Only Hospital can write result");
        require(state != Examination.States.Finished, "Examination is finished");
        require(state == Examination.States.Paid, "Examination is not paid yet");
        result = _newResult;
    }
}

contract Patient {
    address public onwerAddress;
    string public name;
    address[] public examinations;
    
    constructor(string _name, address _ownerAddress) public {
        name = _name;
        onwerAddress = _ownerAddress;
    }
    
    function addExamination(address _examinationAddr) public {
        examinations.push(_examinationAddr);
    }
    
    function getLengthExamination() external view returns (uint) {
        return examinations.length;
    }
    
    function getExaminationByIndex(uint _idx) external view returns (string, string, uint, string, address, uint, uint) {
        Examination byIdx = Examination(examinations[_idx]);
        Hospital hospital = Hospital(byIdx.hospitalAddress());
        return (byIdx.name(), byIdx.result(), byIdx.cost(), hospital.name(), byIdx.hospitalAddress(), byIdx.dateCreated(), uint(byIdx.state()));
    }
}

