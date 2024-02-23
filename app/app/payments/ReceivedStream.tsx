import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { CopyIcon, Cross2Icon } from "@radix-ui/react-icons";
import { useState } from "react";
import CountUp from "react-countup";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToastAction } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

export function parseDurationShort(durationMilliseconds: number): string {
  let durationSeconds = durationMilliseconds / 1000;
  let durationMinutes = durationSeconds / 60;
  let durationHours = durationMinutes / 60;
  let durationDays = durationHours / 24;
  let durationWeeks = durationDays / 7;
  let durationMonths = durationWeeks / 4;
  let durationYears = durationMonths / 12;

  if (durationYears >= 1) {
    return `${durationYears.toFixed(2)} years`;
  } else if (durationDays >= 1) {
    return `${durationDays.toFixed(2)} days`;
  } else if (durationHours >= 1) {
    return `${durationHours.toFixed(2)} hours`;
  } else if (durationMinutes >= 1) {
    return `${durationMinutes.toFixed(2)} minutes`;
  } else {
    return `${durationSeconds.toFixed(2)} seconds`;
  }
}

type Event = {
  type:
    | "stream_created"
    | "stream_accepted"
    | "stream_claimed"
    | "stream_cancelled"
    | "unknown";
  timestamp: number;
  data: {
    amount?: number;
    amount_to_sender?: number;
    amount_to_recipient?: number;
  };
};

type StreamCreateEvent = {
  version: string;
  guid: {
    creation_number: string;
    account_address: string;
  };
  sequence_number: string;
  type: string;
  data: {
    amount: number;
    duration_in_seconds: number;
    receiver_address: string;
    sender_address: string;
    stream_id: number;
    timestamp: number;
  };
};

type StreamAcceptEvent = {
  version: string;
  guid: {
    creation_number: string;
    account_address: string;
  };
  sequence_number: string;
  type: string;
  data: {
    receiver_address: string;
    sender_address: string;
    stream_id: number;
    timestamp: number;
  };
};

type StreamClaimEvent = {
  version: string;
  guid: {
    creation_number: string;
    account_address: string;
  };
  sequence_number: string;
  type: string;
  data: {
    amount: number;
    receiver_address: string;
    sender_address: string;
    stream_id: number;
    timestamp: number;
  };
};

type StreamCloseEvent = {
  version: string;
  guid: {
    creation_number: string;
    account_address: string;
  };
  sequence_number: string;
  type: string;
  data: {
    amount_to_receiver?: number;
    amount_to_sender?: number;
    receiver_address: string;
    sender_address: string;
    stream_id: number;
    timestamp: number;
  };
};

type StreamEvent = {
  version: string;
  guid: {
    creation_number: string;
    account_address: string;
  };
  sequence_number: string;
  type: string;
  data: {
    amount?: number;
    duration_in_seconds?: number;
    amount_to_recipient?: number;
    amount_to_sender?: number;
    receiver_address: string;
    sender_address: string;
    stream_id: number;
    timestamp: number;
  };
};

type streamAPIResponse =
  | StreamAcceptEvent
  | StreamClaimEvent
  | StreamCloseEvent
  | StreamCreateEvent;

export default function ReceivedStream(props: {
  isTxnInProgress: boolean;
  setTxn: (isTxnInProgress: boolean) => void;
  senderAddress: string;
  startTimestampSeconds: number;
  durationSeconds: number;
  amountAptFloat: number;
  streamId: number;
}) {
  // wallet state
  const { account, signAndSubmitTransaction } = useWallet();
  // toast state
  const { toast } = useToast();

  // time state for the progress bar
  const [timeNow, setTimeNow] = useState(Date.now());
  // event state for the history
  const [events, setEvents] = useState<Event[]>([]);

  /* 
    Refreshes the progress bar every second
  */
  setInterval(() => {
    setTimeNow(Date.now());
  }, 1000);

  /* 
    calculates the amount of APT to claim based on the time elapsed
  */
  const getAmountToClaim = () => {
    let timeElapsedSeconds = timeNow / 1000 - props.startTimestampSeconds;
    let timeElapsedFraction = timeElapsedSeconds / props.durationSeconds;
    let amountToClaim = props.amountAptFloat * timeElapsedFraction;
    return amountToClaim;
  };

  /* 
    Claim APT from the stream
  */
  const claimApt = async () => {
    /* 
      TODO:: Set the isTxnInProgress prop to true
    */
    props.setTxn(true);

    /* 
      TODO: Create the payload for the claim_stream transaction
    */
    const payload = {
      type: "entry_function_payload",
      function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::claim_stream`,
      type_arguments: [],
      arguments: [props.senderAddress],
    };

    /* 
      TODO: In a try/catch block, sign and submit the transaction using the signAndSubmitTransaction
            function provided by the wallet adapter. Use the payload created above.
      
      HINT: 
        - In case of an error, set the isTxnInProgress prop to false and return.
        - In case of success, show a toast notification with a link to the transaction on the explorer.

      -- toast -- 
      toast({
        title: "APT claimed!",
        action: (
          <a
            href={`PLACEHOLDER: Input the link to the transaction on the explorer here`}
            target="_blank"
          >
            <ToastAction altText="View transaction">View txn</ToastAction>
          </a>
        ),
      });
    */

    try {
      let res = await signAndSubmitTransaction(payload);

      toast({
        title: "APT claimed!",
        action: (
          <a
            href={`https://explorer.aptoslabs.com/txn/${res.hash}/userTxnOverview?network=testnet`}
            target="_blank"
          >
            <ToastAction altText="View transaction">View txn</ToastAction>
          </a>
        ),
      });
    } catch (e: any) {
      props.setTxn(false);
      console.log("Error: " + e.message);
      return;
    }

    /* 
      TODO: Set the isTxnInProgress prop to false
    */
    props.setTxn(false);
    return;
  };

  /* 
    Accept the stream
  */
  const acceptStream = async () => {
    /* 
      TODO: Set the isTxnInProgress prop to true
    */
    props.setTxn(true);
    /* 
      TODO: Create the payload for the accept_stream transaction
    */
    const payload = {
      type: "entry_function_payload",
      function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::accept_stream`,
      type_arguments: [],
      arguments: [props.senderAddress],
    };
    /* 
      TODO: In a try/catch block, sign and submit the transaction using the signAndSubmitTransaction
            function provided by the wallet adapter. Use the payload created above.
      
      HINT: 
        - In case of an error, set the isTxnInProgress prop to false and return.
        - In case of success, show a toast notification with a link to the transaction on the explorer.

      -- toast --
      toast({
        title: "Stream accepted!",
        action: (
          <a
            href={`PLACEHOLDER: Input the link to the transaction on the explorer here`}
            target="_blank"
          >
            <ToastAction altText="View transaction">View txn</ToastAction>
          </a>
        ),
      });
    */
    try {
      let res = await signAndSubmitTransaction(payload);

      toast({
        title: "Stream accepted!",
        action: (
          <a
            href={`https://explorer.aptoslabs.com/txn/${res.hash}/userTxnOverview?network=testnet`}
            target="_blank"
          >
            <ToastAction altText="View transaction">View txn</ToastAction>
          </a>
        ),
      });
    } catch (e: any) {
      props.setTxn(false);
      console.log("Error: " + e.message);
      return;
    }

    /* 
      TODO: Set the isTxnInProgress prop to false
    */
    props.setTxn(false);
    return;
  };

  /* 
    Reject the stream
  */
  const rejectStream = async () => {
    /* 
      TODO: Return if the account is not defined
    */
    if (!account) {
      return;
    }
    /* 
      TODO: Set the isTxnInProgress prop to true
    */
    props.setTxn(true);
    /* 
      TODO: Create the payload for the cancel_stream transaction
    */
    const payload = {
      type: "entry_function_payload",
      function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::cancel_stream`,
      type_arguments: [],
      arguments: [props.senderAddress, account.address],
    };
    /* 
      TODO: In a try/catch block, sign and submit the transaction using the signAndSubmitTransaction
            function provided by the wallet adapter. Use the payload created above.
      
      HINT: 
        - In case of an error, set the isTxnInProgress prop to false and return.
        - In case of success, show a toast notification with a link to the transaction on the explorer.

      -- toast --
      toast({
        title: "Stream rejected",
        action: (
          <a
            href={`PLACEHOLDER: Input the link to the transaction on the explorer here`}
            target="_blank"
          >
            <ToastAction altText="View transaction">View txn</ToastAction>
          </a>
        ),
      });
    */
    try {
      let res = await signAndSubmitTransaction(payload);

      toast({
        title: "Stream rejected!",
        action: (
          <a
            href={`https://explorer.aptoslabs.com/txn/${res.hash}/userTxnOverview?network=testnet`}
            target="_blank"
          >
            <ToastAction altText="View transaction">View txn</ToastAction>
          </a>
        ),
      });
    } catch (e: any) {
      props.setTxn(false);
      console.log("Error: " + e.message);
      return;
    }

    /* 
      TODO: Set the isTxnInProgress prop to false
    */
    props.setTxn(false);
    return;
  };

  /* 
    Fetches the event list from the event store
  */
  const getEventList = async (
    event_store_name: string
  ): Promise<StreamEvent[]> => {
    /* 
      TODO: Fetch the event of the event_store_name from the event store and return the result in 
            a promise. 
    */
    const url = `https://fullnode.testnet.aptoslabs.com/v1/accounts/${process.env.MODULE_ADDRESS}/events/${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::ModuleEventStore/${event_store_name}?limit=10000`;
    const response = await fetch(url, { method: "GET" });

    return response.json();
  };

  /* 
    Retrieves the stream events from the event store and sets the events state
  */
  const getStreamEvents = async () => {
    /* 
      TODO: Use the getEventList function to fetch all the events from the event store. 
    */
    const eventsPromise = await Promise.all([
      getEventList("stream_create_events"),
      getEventList("stream_accept_events"),
      getEventList("stream_claim_events"),
      getEventList("stream_close_events"),
    ]);

    const events: StreamEvent[] = eventsPromise.flat(1);
    /* 
      TODO: Set the events state with events for the specific stream only. Parse the event data to match the 
            Event type above. 

      HINT: 
        - Use the streamId prop to filter the events
        - Use the event.type to determine the type of the event to properly parse the event data
        - Remember to convert units when necessary
    */
    const filteredEvents: Event[] = events
      .filter(
        (event) =>
          event.data.stream_id === props.streamId
      )
      .map((event) => {
        const eventType = event.type.split("::")[2];
        switch (eventType) {
          case "StreamCreateEvent":
            return {
              type: "stream_created",
              timestamp: 1000 * event.data.timestamp,
              data: {
                amount: event.data?.amount ? event.data.amount / 1e8 : 0,
              },
            };
          case "StreamAcceptEvent":
            return {
              type: "stream_accepted",
              timestamp: 1000 * event.data.timestamp,
              data: {},
            };
          case "StreamClaimEvent":
            return {
              type: "stream_claimed",
              timestamp: 1000 * event.data.timestamp,
              data: {
                amount: event.data?.amount ? event.data.amount / 1e8 : 0,
              },
            };
          case "StreamCloseEvent":
            return {
              type: "stream_cancelled",
              timestamp: 1000 * event.data.timestamp,
              data: {
                amount_to_sender: event.data?.amount_to_sender ? event.data.amount_to_sender / 1e8 : 0,
                amount_to_recipient: event.data?.amount_to_recipient ? event.data?.amount_to_recipient / 1e8 : 0,
              },
            };
          default:
            return {
              type: "unknown",
              timestamp: 1000 * event.data.timestamp,
              data: {},
            };
        }
      });

    // set the event state using setEvent
    setEvents(filteredEvents);
  };

  return (
    <Card className="relative bg-neutral-300 border border-neutral-200 rounded-lg">
      <CardContent className="flex flex-col justify-between">
        <div className="w-full flex flex-col border-b border-neutral-200 p-4 space-y-3">
          <div className="flex flex-row items-center font-matter text-2xl space-x-3">
            <Image
              src="/aptos-icon.svg"
              alt="Aptos Logo"
              width={22}
              height={22}
            />
            {
              /* 
                TODO: Display the different amount based on the stream status

                HINT: 
                  - Use the getAmountToClaim function and the amountAptFloat prop to determine if the
                    stream is completed
                  - Use the startTimestampSeconds prop to determine if the stream is accepted yet
                  - if the stream is not accepted yet, display the static total amount 
                  - if the stream is completed, display the static total amount
                  - if the stream is active (accepted, but not completed), display the count up 
                    animation
              
                -- count up animation --
                <CountUp
                  start={getAmountToClaim()}
                  end={props.amountAptFloat}
                  duration={props.durationSeconds}
                  separator=","
                  decimals={8}
                  decimal="."
                  prefix=""
                  suffix=""
                  useEasing={false}
                />

                -- static amount --
                <p>{props.amountAptFloat}</p>
              */
              props.startTimestampSeconds !== 0 &&
              getAmountToClaim() < props.amountAptFloat ? (
                <CountUp
                  start={getAmountToClaim()}
                  end={props.amountAptFloat}
                  duration={props.durationSeconds}
                  separator=","
                  decimals={8}
                  decimal="."
                  prefix=""
                  suffix=""
                  useEasing={false}
                />
              ) : (
                <p>{props.amountAptFloat}</p>
              )
            }

            {
              /* 
                TODO: Show the reject button only if the stream is not completed 

                HINT: 
                - Use the getAmountToClaim function and the amountAptFloat prop to determine if the 
                  stream is completed

                -- reject button --
                <div className="w-full flex items-center justify-end absolute top-4 right-4">
                  <div className="bg-neutral-200 text-neutral-100 p-1.5 rounded-md hover:text-red-400 hover:cursor-pointer hover:bg-neutral-100 hover:bg-opacity-25">
                    <p onClick={rejectStream}>
                      <Cross2Icon />
                    </p>
                  </div>
                </div>
              */
              getAmountToClaim() < props.amountAptFloat && (
                <div className="w-full flex items-center justify-end absolute top-4 right-4">
                  <div className="bg-neutral-200 text-neutral-100 p-1.5 rounded-md hover:text-red-400 hover:cursor-pointer hover:bg-neutral-100 hover:bg-opacity-25">
                    <p onClick={rejectStream}>
                      <Cross2Icon />
                    </p>
                  </div>
                </div>
              )
            }
          </div>

          {
            /* 
              TODO: Show the progress bar based on the stream status

              HINT: 
                - if the stream is not accepted yet, show a progress bar with 0 value
                - if the stream is completed, show a progress bar with 100 value
                - if the stream is active (accepted, but not completed), show a progress bar with the 
                  percentage of the amount claimed

              -- progress bar: 0 value --
              <Progress value={0} max={100} className="w-full" />

              -- progress bar: 100 value --
              <Progress value={100} max={100} className="w-full" />

              -- progress bar: percentage value --
              <Progress
                value={(getAmountToClaim() / props.amountAptFloat) * 100}
                max={100}
                className="w-full bg-green-500 h-3 rounded"
              />
              */
            props.startTimestampSeconds !== 0 &&
            props.durationSeconds + props.startTimestampSeconds >
              Date.now() / 1000 ? (
              <Progress
                value={(getAmountToClaim() / props.amountAptFloat) * 100}
                max={100}
                className="w-full bg-green-500 h-3 rounded"
              />
            ) : props.durationSeconds + props.startTimestampSeconds <=
              Date.now() / 1000 ? (
              <Progress value={100} max={100} className="w-full" />
            ) : (
              <Progress value={0} max={100} className="w-full" />
            )
          }

          <div className="flex flex-row items-center justify-between w-full">
            <Dialog>
              <DialogTrigger>
                <p
                  className="text-blue-400 hover:underline text-xs"
                  onClick={getStreamEvents}
                >
                  View History
                </p>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader className="border-b border-neutral-300 pb-4">
                  <DialogTitle>Payment History</DialogTitle>
                </DialogHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Action</TableHead>
                      <TableHead className="text-center">Time</TableHead>
                      <TableHead className="text-center">
                        Additional info
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {
                      /* 
                        TODO: Show a skeleton row if the events array is empty

                        HINT: 
                          - Use the events array to determine if the events are empty

                        -- skeleton row --
                        
                      */
                      events.length === 0 && (
                        <TableRow>
                          <TableCell className="items-center">
                            <div className="flex flex-row justify-center items-center w-full">
                              <Skeleton className="h-4 w-28" />
                            </div>
                          </TableCell>
                          <TableCell className="items-center">
                            <div className="flex flex-row justify-center items-center w-full">
                              <Skeleton className="h-4 w-20" />
                            </div>
                          </TableCell>
                          <TableCell className="items-center">
                            <div className="flex flex-row justify-center items-center w-full">
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    }
                    {
                      /* 
                        TODO: Display each event in the events array with the following format:
                      
                        -- table row -- 
                        
                      */
                      events.length > 0 &&
                        events.map((event) => {
                          return (
                            <TableRow key={event.timestamp}>
                              <TableCell className="text-center">
                                {event.type === "stream_created" && (
                                  <>
                                    <span className="font-mono">
                                      Stream created
                                    </span>
                                  </>
                                )}

                                {event.type === "stream_accepted" && (
                                  <>
                                    <span className="font-mono">
                                      Stream accepted
                                    </span>
                                  </>
                                )}
                                {event.type === "stream_claimed" && (
                                  <>APT claimed</>
                                )}

                                {event.type === "stream_cancelled" && (
                                  <>Stream cancelled</>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {new Intl.DateTimeFormat('en-US', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: true
                                }).format(new Date(event.timestamp))}
                              </TableCell>
                              <TableCell className="text-center">
                                {/* stream_created: */}
                                {event.type === "stream_created" && (
                                  <>
                                    <span className="font-mono">
                                      {event.data.amount} APT streaming
                                    </span>
                                  </>
                                )}
                                {/* - stream_accepted: */}
                                {event.type === "stream_accepted" && (
                                  <>
                                    <span className="font-mono">No data</span>
                                  </>
                                )}
                                {/* - stream_claimed: */}
                                {event.type === "stream_claimed" && (
                                  <>
                                    <span className="font-mono">
                                     { event.data.amount} APT claimed
                                    </span>
                                  </>
                                )}
                                {/* - stream_cancelled: */}
                                {event.type === "stream_cancelled" && (
                                  <>
                                    <span className="font-mono">
                                      Stream canceled
                                    </span>
                                  </>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                    }
                  </TableBody>
                </Table>
              </DialogContent>
            </Dialog>

            <div className="flex flex-row items-center justify-end space-x-2 font-matter">
              <p className="text-sm text-neutral-100">Total:</p>
              <p className="text-lg">{props.amountAptFloat} APT</p>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col items-center gap-3 p-4 border-b border-neutral-200">
          <div className="w-full flex flex-row gap-3 items-center justify-between">
            <p className="text-neutral-100 text-sm">From:</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div
                    className="font-matter bg-neutral-200 text-white hover:bg-neutral-100 space-x-2 text-xs px-3 flex flex-row items-center py-2 rounded hover:bg-opacity-25"
                    onClick={() => {
                      /*
                        TODO: Copy the sender address to the clipboard and show a toast notification
                        with a link to the sender account on the explorer
                      */
                      toast({
                        description: "Address copied to clipboard",
                        action: (
                          <a
                            href={`https://explorer.aptoslabs.com/account/${props.senderAddress}?network=testnet`}
                            target="_blank"
                          >
                            <ToastAction altText="View account on explorer">
                              View on explorer
                            </ToastAction>
                          </a>
                        ),
                      });
                    }}
                  >
                    <p className="">
                      {`${props.senderAddress.slice(
                        0,
                        6
                      )}...${props.senderAddress.slice(-4)}`}
                    </p>
                    <CopyIcon />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="w-full">
                  <p>{props.senderAddress}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {
            /* 
              TODO: Display the end time if the stream has been accepted

              -- end time --
              <div className="w-full flex flex-row gap-3 items-center justify-between">
                <p className="text-neutral-100 text-sm">End:</p>
                <p className="text-end text-sm">
                  {new Date(
                    (props.startTimestampSeconds + props.durationSeconds) * 1000
                  ).toLocaleString()}
                </p>
              </div>
            */
            props.startTimestampSeconds !== 0 &&
              props.durationSeconds + props.startTimestampSeconds >
                Date.now() / 1e3 && (
                <div className="w-full flex flex-row gap-3 items-center justify-between">
                  <p className="text-neutral-100 text-sm">End:</p>
                  <p className="text-end text-sm">
                    {new Date(
                      (props.startTimestampSeconds + props.durationSeconds) *
                        1000
                    ).toLocaleString()}
                  </p>
                </div>
              )
          }
          {
            /* 
              TODO: Display the duration if the stream has not been accepted yet

              -- duration --
              <div className="w-full flex flex-row items-center justify-between">
                <p className="text-neutral-100 text-sm">Duration:</p>
                <span className="font-matter">
                  {parseDurationShort(props.durationSeconds * 1000)}
                </span>
              </div>
            */
            props.startTimestampSeconds === 0 && (
              <div className="w-full flex flex-row items-center justify-between">
                <p className="text-neutral-100 text-sm">Duration:</p>
                <span className="font-matter">
                  {parseDurationShort(props.durationSeconds * 1000)}
                </span>
              </div>
            )
          }
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex flex-row justify-between w-full gap-4 p-4">
          {
            /* 
              TODO: Display the claim button if the stream is active (accepted, but not completed) and 
              the accept button if the stream is not accepted yet.

              -- claim button --
              <Button
                className="grow bg-green-800 hover:bg-green-700 text-white"
                onClick={() => {console.log("PLACEHOLDER: claim apt here")}}
              >
                Claim
              </Button>

              -- accept button --
              <Button
                className="grow bg-green-800 hover:bg-green-700 text-white"
                onClick={() => {console.log("PLACEHOLDER: accept stream here")}
              >
                Accept
              </Button>
            */
            props.startTimestampSeconds !== 0 &&
            props.durationSeconds + props.startTimestampSeconds >
              Date.now() / 1000 ? (
              <Button
                className="grow bg-green-800 hover:bg-green-700 text-white"
                onClick={() => {
                  claimApt();
                }}
              >
                Claim
              </Button>
            ) : (
              <Button
                className="grow bg-green-800 hover:bg-green-700 text-white"
                onClick={() => {
                  acceptStream();
                }}
              >
                Accept
              </Button>
            )
          }
          {
            /* 
          
              TODO: Display the reject button if the stream is active (accepted, but not completed) and
              the accept button if the stream is not accepted yet.
            
              -- reject button --
              <Button
                className="grow bg-red-800 hover:bg-red-700 text-white font-matter"
                onClick={() => {console.log("PLACEHOLDER: reject stream here")}}
              >
                Reject
              </Button>
            */
            props.startTimestampSeconds !== 0 &&
              props.durationSeconds + props.startTimestampSeconds <=
                Date.now() / 1000 && (
                <Button
                  className="grow bg-red-800 hover:bg-red-700 text-white font-matter"
                  onClick={() => {
                    rejectStream();
                  }}
                >
                  Reject
                </Button>
              )
          }
        </div>
      </CardFooter>
    </Card>
  );
}
