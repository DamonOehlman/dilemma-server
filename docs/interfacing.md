## Interfacing with the Server

Interfacing with the server is primarily done through interfacing with a [ØMQ](http://zeromq.org/) TCP socket on port `1441` (by default) of the
machine this server is run on.  ØMQ was chosen as the communication layer as it provides bindings for a large number of languages and people should
be free to choose whatever language they want for implementing their strategies.

Alternatively the node [dilemma](https://github.com/DamonOehlman/dilemma) runner can be used to interface with your program simply using stdio.  If
you would prefer to go down this route (it is very simple, but does mean you will need to install node to execute the runner) then check out the `dilemma` README.