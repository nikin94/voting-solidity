// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "hardhat/console.sol";

contract Voting {
    struct Vote {
        bool finished;
        uint256 createdAt;
        uint256 mostVotes;
        uint256 balance;
        uint256 candidatesCount;
        address payable leader;
        address[] candidates;
        mapping(address => bool) voters;
        mapping(address => uint256) votesCounter;
    }

    address payable public owner;
    mapping(uint256 => Vote) public votings;
    uint256 votingsCount;
    uint256 commission;

    constructor() {
        owner = payable(msg.sender);
    }

    modifier restricted() {
        require(msg.sender == owner, "Must be the owner");
        _;
    }

    function addVoting(address[] memory candidates) public restricted {
        require(candidates.length > 1, "Need more than one candidate");

        Vote storage newVote = votings[votingsCount++];
        newVote.createdAt = block.timestamp;
        newVote.candidatesCount = candidates.length;
        newVote.candidates = candidates;
    }

    function vote(uint256 index, address payable candidate) public payable {
        Vote storage voting = votings[index];
        require(!votings[index].finished, "Voting is already finished");
        require(block.timestamp <= voting.createdAt + 259200, "Voting is over");
        require(!voting.voters[msg.sender], "Already voted");
        require(msg.value == 0.01 ether, "Need to send 0.01 ETH");

        voting.voters[msg.sender] = true;
        voting.votesCounter[candidate] += 1;
        voting.balance += msg.value;

        if (voting.votesCounter[candidate] > voting.mostVotes) {
            voting.mostVotes = voting.votesCounter[candidate];
            voting.leader = candidate;
        }
    }

    function finishVoting(uint256 index) public payable {
        require(!votings[index].finished, "Voting is already finished");
        require(
            block.timestamp > votings[index].createdAt + 259200,
            "Can't finish voting until 3 days passed"
        );

        (bool sent, bytes memory data) = votings[index].leader.call{
            value: (votings[index].balance / 10) * 9
        }("");

        commission += votings[index].balance / 10;
        votings[index].finished = true;
    }

    function withdrawComission() public payable restricted {
        (bool sent, bytes memory data) = owner.call{value: commission}("");
        commission = 0;
    }

    function getCandidates(uint256 index)
        public
        view
        returns (address[] memory)
    {
        return votings[index].candidates;
    }

    function getVotingInfo(uint256 index)
        public
        view
        returns (
            uint256,
            uint256,
            address
        )
    {
        return (
            votings[index].createdAt,
            votings[index].mostVotes,
            votings[index].leader
        );
    }

    function userAlreadyVoted(uint256 index, address _address)
        public
        view
        returns (bool)
    {
        return votings[index].voters[_address];
    }

    function getCandidateVotesCount(uint256 index, address _address)
        public
        view
        returns (uint256)
    {
        return votings[index].votesCounter[_address];
    }

    function getVotingBalance(uint256 index) public view returns (uint256) {
        return votings[index].balance;
    }

    function getVotingLeader(uint256 index)
        public
        view
        returns (address payable)
    {
        return votings[index].leader;
    }

    function getComission() public view restricted returns (uint256) {
        return commission;
    }
}
