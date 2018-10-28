const Dapp = {

    hospitalAddress: undefined,
    patientAddress: undefined,
    hospitalOwner: undefined,

    createNewHospital: function() {
        var hospitalName = $('#frmNewHospital input[name=name]').val();
        var fromAddress = $('#frmNewHospital input[name=owner]').val();
        Dapp.web3.personal.unlockAccount(
            fromAddress,
            prompt("enter your password for unlock address"),
            function(error, result) {
                if (!error) {
                    var pContract = Dapp.web3.eth.contract(compiled_contracts.Hospital.abi);
                    pContract.new(
                        hospitalName,
                        {
                            data: compiled_contracts.Hospital.data,
                            from: fromAddress,
                            gas: 4700000
                        }, function(e, contract){
                            console.log(e, contract);
                            if (typeof contract.address !== 'undefined') {
                                Dapp.loadHospitalAddressAt(contract.address);
                                console.log('Contract mined! address: ' + contract.address + ' transactionHash: ' + contract.transactionHash);
                            }
                        }
                    )
                }
            }
        );
        $('#modelNewHospital').modal('hide');
    },
    createNewPatient: function() {
        var hContract = Dapp.web3.eth.contract(compiled_contracts.Hospital.abi);
        var hospital= hContract.at(Dapp.hospitalAddress);
        var patientName = $("#frmNewPatient input[name=name]").val();
        var personAddress = $("#frmNewPatient input[name=personAddress]").val();
        console.log("patientName", patientName);
        console.log("personAddress", personAddress);
        hospital.createPatient(
            patientName,
            personAddress,
            {
                from: Dapp.hospitalOwner,
                gas: 4700000
            }, function(e, txHash) {
                console.log(e, txHash);
                var patientCreatedEvent = hospital.PatientCreated();
                patientCreatedEvent.watch(function(error, result) {
                    console.log("=== on watch ===")
                    console.log(error, result);
                    if (!error) {
                        if (result.transactionHash == txHash) {
                            $('#modelNewPatient').modal('hide');
                            prompt("patient is created successful at", result.args.patientAddress);
                        }
                    }
                    patientCreatedEvent.stopWatching();
                })
                
            }
        )
    },
    createExamination: function() {
        var hContract = Dapp.web3.eth.contract(compiled_contracts.Hospital.abi);
        var hospital= hContract.at(Dapp.hospitalAddress);
        var name = $("#frmNewExamination input[name=name]").val();
        var cost = $("#frmNewExamination input[name=cost]").val();
        var patientAddress = $("#frmNewExamination input[name=patientAddress]").val();
        
        hospital.createExamination(
            name,
            cost,
            patientAddress,
            {
                from: Dapp.hospitalOwner,
                gas: 4700000
            }, function(e, txHash) {
                console.log(e, txHash);
                var examinationCreatedEvent = hospital.ExaminationCreated();
                examinationCreatedEvent.watch(function(error, result) {
                    if (!error) {
                        if (result.transactionHash == txHash) {
                            $('#modelNewExamination').modal('hide');
                            prompt("Examination is created successful at", result.args.examinationAddress);
                        }
                    }
                    examinationCreatedEvent.stopWatching();
                });
            }
        )
    },
    loadHospitalAddress: function() {
        var address = prompt("Please enter hospital address", "0x...");
        if (!Dapp.web3.isAddress(address)) {
            alert("Please input a valid address!");
            return;
        }
        Dapp.loadHospitalAddressAt(address);
    },
    loadHospitalAddressAt: function(address) {
        var hContract = Dapp.web3.eth.contract(compiled_contracts.Hospital.abi);
        var hospital= hContract.at(address);
        var name = hospital.name();
        var owner = hospital.ownerAddress();
        Dapp.hospitalOwner = owner;
        Dapp.hospitalAddress = address;

        var template = doT.template(document.getElementById('templateHospitalInfo').text);
        $("[template-hospitalInfo]").html(template({'name': name, 'address': address, 'ownerAddress': owner}));
    },
    getPatient: function() {
        var address = $("#existingPatient").val();
        var pContract = Dapp.web3.eth.contract(compiled_contracts.Patient.abi);
        var patient= pContract.at(address);
        var name = patient.name();
        var personAddress = patient.onwerAddress();
        var lengthExamination = patient.getLengthExamination();
        var examinations = []
        for(var i = 0; i < lengthExamination; i++) {
            var arry = patient.getExaminationByIndex(i);
            examinations.push({
                examinationAddress: patient.examinations(i),
                name: arry[0],
                result: arry[1],
                cost: arry[2].toNumber(),
                hospitalName: arry[3],
                hospitalAddress: arry[4],
                dateCreated: new Date(arry[5].toNumber()),
                status: arry[6]
            });
        }
        
        var jsonData = {'name': name, 'personAddress': personAddress, 'examinations': examinations};

        console.log("jsonData", jsonData);
        var pollTemplate = doT.template(document.getElementById('templatePatientInfo').text);
        document.getElementById('patientInfo').innerHTML = pollTemplate(jsonData);
    },
    updateExaminationResult: function() {
        var examinationAddress = $("#frmUpdateExaminationResult input[name=examinationAddress]").val();
        var result = $("#frmUpdateExaminationResult input[name=result]").val();
        
        var exContract = Dapp.web3.eth.contract(compiled_contracts.Examination.abi);
        var examination = exContract.at(examinationAddress);
        
        examination.updateResult(
            result,
            {
                from: Dapp.hospitalAddress,
                gas: 4700000
            }, function(e, txHash) {
                console.log(e, txHash);
                var payExaminationEvent = hospital.PayExaminationEvent();
                payExaminationEvent.watch(function(error, result) {
                    if (!error) {
                        if (result.transactionHash == txHash) {
                            $('#modelPayExamination').modal('hide');
                            alert("Examination is paid successful");
                        }
                    }
                    payExaminationEvent.stopWatching();
                });
            }
        )
    },
    payExamination: function() {
        var examinationAddress = $("#frmPayExamination input[name=examinationAddress]").val();
        var fromAddress = $("#frmPayExamination input[name=fromAddress]").val();
        
        var exContract = Dapp.web3.eth.contract(compiled_contracts.Examination.abi);
        var examination = exContract.at(examinationAddress);
        
        var hContract = Dapp.web3.eth.contract(compiled_contracts.Hospital.abi);
        var hospital = hContract.at(examination.hospitalAddress());

        hospital.payExamination(
            examinationAddress,
            {
                from: fromAddress,
                gas: 4700000
            }, function(e, txHash) {
                console.log(e, txHash);
                var payExaminationEvent = hospital.PayExaminationEvent();
                payExaminationEvent.watch(function(error, result) {
                    if (!error) {
                        if (result.transactionHash == txHash) {
                            $('#modelPayExamination').modal('hide');
                            alert("Examination is paid successful");
                        }
                    }
                    payExaminationEvent.stopWatching();
                });
            }
        )
    }
};

window.addEventListener("load", function() {
  if (typeof web3 !== "undefined") {
    console.log("Web3 Detected! " + web3.currentProvider.constructor.name);
    Dapp.web3 = new Web3(web3.currentProvider);
  } else {
    console.log("No Web3 Detected... using HTTP Provider");
    Dapp.web3 = new Web3(
      new Web3.providers.HttpProvider("http://localhost:8545")
    );
  }

});
