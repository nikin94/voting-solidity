task('add-voting', 'Add new voting')
  .addParam('address', "The contract's address")
  .addParam(
    'candidates',
    'Candidates to vote for. List of addresses with commas'
  )
  .setAction(async ({ address, candidates }) => {
    const Contract = await ethers.getContractFactory('Voting');
    const contract = await Contract.attach(address);
    const newVoting = await contract.addVoting(candidates.split(','));
    console.log(newVoting);
  });

task('vote', 'Vote for candidate')
  .addParam('address', "The contract's address")
  .addParam('index', 'Index of voting')
  .addParam('candidate', "Candidate's address to vote for")
  .setAction(async ({ address, index, candidate }) => {
    const Contract = await ethers.getContractFactory('Voting');
    const contract = await Contract.attach(address);
    const newVote = await contract.vote(index, candidate);
    console.log(newVote);
  });

task('finish-voting', 'Finish voting')
  .addParam('address', "The contract's address")
  .addParam('index', 'Index of voting')
  .setAction(async ({ address, index }) => {
    const Contract = await ethers.getContractFactory('Voting');
    const contract = await Contract.attach(address);
    const finishVoting = await contract.finishVoting(index);
    console.log(finishVoting);
  });

task('withdraw-comission', 'Withdraw comission')
  .addParam('address', "The contract's address")
  .setAction(async ({ address }) => {
    const Contract = await ethers.getContractFactory('Voting');
    const contract = await Contract.attach(address);
    const withdraw = await contract.withdrawComission();
    console.log(withdraw);
  });

task('get-candidates', 'Get voting candidates')
  .addParam('address', "The contract's address")
  .addParam('index', 'Index of voting')
  .setAction(async ({ address, index }) => {
    const Contract = await ethers.getContractFactory('Voting');
    const contract = await Contract.attach(address);
    const candidates = await contract.getCandidates(+index);
    console.log(candidates);
  });
