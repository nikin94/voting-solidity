const { expect } = require('chai');
const { ethers } = require('hardhat');

let Voting, voting, owner, candidates;
const fourDaysInSeconds = 4 * 24 * 60 * 60;

beforeEach(async () => {
  signers = await ethers.getSigners();
  owner = signers[0];

  Voting = await ethers.getContractFactory('Voting');
  voting = await Voting.deploy();
  await voting.deployed();

  candidates = [signers[1].address, signers[2].address];
  await voting.addVoting(candidates);
});

describe('Contract', () => {
  it('Should set the right owner', async () => {
    expect(await voting.owner()).to.equal(owner.address);
  });

  it('Should withdraw commission', async () => {
    await voting.connect(signers[3]).vote(0, signers[1].address, {
      value: (1e16).toLocaleString('fullwide', { useGrouping: false })
    });
    await network.provider.send('evm_increaseTime', [fourDaysInSeconds]);
    await network.provider.send('evm_mine');
    await voting.finishVoting(0);

    const ownerOldBalance = await ethers.provider.getBalance(owner.address);
    await voting.connect(owner).withdrawComission();

    expect(+ownerOldBalance).to.be.lessThan(
      +(await ethers.provider.getBalance(owner.address))
    );
  });

  it('Should get the voting information', async () => {
    const info = await voting.getVotingInfo(0);
    expect(+info.createdAt).to.be.an('number');
  });

  it("Should get the candidate's votes count", async () => {
    await voting.vote(0, signers[1].address, {
      value: (1e16).toLocaleString('fullwide', { useGrouping: false })
    });
    await voting.connect(signers[3]).vote(0, signers[1].address, {
      value: (1e16).toLocaleString('fullwide', { useGrouping: false })
    });

    const votesCount = await voting.getCandidateVotesCount(
      0,
      signers[1].address
    );
    expect(votesCount).to.be.equal(2);
  });
});

describe('addVoting()', () => {
  it('Only owner should be able to add votings', async () => {
    await expect(
      voting.connect(signers[3]).addVoting(candidates)
    ).to.be.revertedWith('Must be the owner');
  });

  it('Should add votings properly', async () => {
    const _candidates = await voting.getCandidates(0);
    expect(_candidates).to.deep.equal(candidates);
  });

  it('Should stop operation if not enough candidates', async () => {
    await expect(voting.addVoting([signers[1].address])).to.be.revertedWith(
      'Need more than one candidate'
    );
  });
});

describe('Vote()', () => {
  it('Should be abble to vote', async () => {
    const _voting = await voting.votings(0);
    const { balance, leader } = _voting;

    await voting.connect(signers[3]).vote(0, signers[1].address, {
      value: (1e16).toLocaleString('fullwide', { useGrouping: false })
    });

    const newBalance = await voting.getVotingBalance(0);
    expect(newBalance).to.be.equal(balance + 1e16);
    expect(await voting.userAlreadyVoted(0, signers[3].address)).to.be.true;
    expect(await voting.getVotingLeader(0)).to.be.not.equal(leader);
  });

  it('Should cancel vote if voting is over', async () => {
    await network.provider.send('evm_increaseTime', [fourDaysInSeconds]);
    await network.provider.send('evm_mine');
    await expect(
      voting.connect(signers[3]).vote(0, signers[1].address, {
        value: (1e16).toLocaleString('fullwide', { useGrouping: false })
      })
    ).to.be.revertedWith('Voting is over');
  });

  it('Should cancel vote if voting marked as finished', async () => {
    await network.provider.send('evm_increaseTime', [fourDaysInSeconds]);
    await network.provider.send('evm_mine');
    await voting.finishVoting(0);
    await expect(
      voting.connect(signers[3]).vote(0, signers[1].address, {
        value: (1e16).toLocaleString('fullwide', { useGrouping: false })
      })
    ).to.be.revertedWith('Voting is already finished');
  });

  it('Should cancel vote if already voted', async () => {
    await voting.connect(signers[3]).vote(0, signers[1].address, {
      value: (1e16).toLocaleString('fullwide', { useGrouping: false })
    });
    await expect(
      voting.connect(signers[3]).vote(0, signers[1].address, {
        value: (1e16).toLocaleString('fullwide', { useGrouping: false })
      })
    ).to.be.revertedWith('Already voted');
  });

  it('Should cancel vote if value is wrong', async () => {
    await expect(
      voting.connect(signers[3]).vote(0, signers[1].address, {
        value: 10
      })
    ).to.be.revertedWith('Need to send 0.01 ETH');
  });

  it("Candidate shouldn't became a leader if votes are equal", async () => {
    await voting.connect(signers[3]).vote(0, signers[1].address, {
      value: (1e16).toLocaleString('fullwide', { useGrouping: false })
    });
    const firstLeader = await voting.getVotingLeader(0);

    await voting.connect(signers[4]).vote(0, signers[2].address, {
      value: (1e16).toLocaleString('fullwide', { useGrouping: false })
    });
    const secondLeader = await voting.getVotingLeader(0);

    expect(firstLeader).to.be.equal(secondLeader);
  });
});

describe('finishVoting()', () => {
  it('Should finish voting', async () => {
    const comissionOld = await voting.getComission();
    await voting.connect(signers[3]).vote(0, signers[1].address, {
      value: (1e16).toLocaleString('fullwide', { useGrouping: false })
    });
    await network.provider.send('evm_increaseTime', [fourDaysInSeconds]);
    await network.provider.send('evm_mine');
    await voting.finishVoting(0);

    await voting.connect(owner);
    expect(comissionOld).to.be.equal(
      (await voting.getComission()) - (await voting.getVotingBalance(0)) / 10
    );
  });

  it('Should fail if Voting is already finished', async () => {
    await network.provider.send('evm_increaseTime', [fourDaysInSeconds]);
    await network.provider.send('evm_mine');
    await voting.finishVoting(0);
    await expect(voting.finishVoting(0)).to.be.revertedWith(
      'Voting is already finished'
    );
  });

  it("Should fail if 3 days didn't pass", async () => {
    await expect(voting.finishVoting(0)).to.be.revertedWith(
      "Can't finish voting until 3 days passed"
    );
  });
});
