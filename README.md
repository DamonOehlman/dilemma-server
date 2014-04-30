# dilemma-server

This is a server for automating the execution of
[prisoners dilemma](http://en.wikipedia.org/wiki/Prisoner's_dilemma)
strategies in an iterated, competitive environment.  This is being done for
an upcoming [NICTA](http://nicta.com.au/) engineering retreat - yeah I know,
NICTA is a cool place to work :)

## Getting Started

Clone the repo, and get the server running:

```
git clone https://github.com/DamonOehlman/dilemma-server.git
cd dilemma-server
npm install
npm start
```

As this is highly experimental, you may need to reset the server data
and restart.  This can be achieved with the following command:

```
rm -rf dilemma-data/ && npm start
```

## Interfacing with the Server

Interfacing with the server is primarily done through interfacing with a [ØMQ](http://zeromq.org/) TCP socket on port `1441` (by default) of the
machine this server is run on.  ØMQ was chosen as the communication layer as it provides bindings for a large number of languages and people should
be free to choose whatever language they want for implementing their strategies.

Alternatively the node [dilemma](https://github.com/DamonOehlman/dilemma) runner can be used to interface with your program simply using stdio.  If
you would prefer to go down this route (it is very simple, but does mean you will need to install node to execute the runner) then check out the `dilemma` README.

### ØMQ Interaction Pattern

The dilemma server implements a ØMQ router, and we use a REQ-ROUTER pattern for client-server interaction.  A typical clients interaction with the server looks something like the following (in pythonesque pseudocode):

```py
socket = connect tcp://<server>:1441 REQ

socket.send_multipart(["reg", "<strategy name>"])

while true:
  command = socket.receive()

  # check the server command (stored in the first part of the message)
  if command[0] == "reset":

    # reset our result data

    # let the server know we have done this
    socket.send_multipart(["reset:ok"])

  # otherwise if we have received an instruction to iterate do that
  else if command[0] == "iterate":

    # read our opponents previous response out of the 2nd part of the server command
    opponent_last = command[1]

    # update our local result data with the opponent response

    # run our strategy
    our_result = run_strategy()

    # save our result to our result data

    # send our result to the server
    socket.send_multipart(["result", our_result])

 # otherwise check if we have been "pinged"
 else if command[0] == "ping"

   # send a pong back
   socket.send_multipart(["pong"])

```

For a concrete example, check out the [python sample in the dilemma-clients repo](https://github.com/DamonOehlman/dilemma-clients/blob/master/zmq/python/dilemma.py)

