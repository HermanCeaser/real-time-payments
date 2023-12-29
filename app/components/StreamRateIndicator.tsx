import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Stream } from "@/app/payments/CreatedStreamList";

/* 
  Finds the best unit to display the stream rate in by changing the bottom of the unit from seconds
  to minutes, hours, days, etc.
*/
function displayStreamRate(streamRatePerSecond: number) {
  if (streamRatePerSecond == 0) {
    return "0 APT / s";
  }

  if (Math.abs(streamRatePerSecond) >= 1) {
    return `${streamRatePerSecond.toLocaleString(undefined, {
      maximumFractionDigits: 3,
    })} APT / s`;
  }

  streamRatePerSecond *= 60; // to minutes
  if (Math.abs(streamRatePerSecond) >= 1) {
    return `${streamRatePerSecond.toLocaleString(undefined, {
      maximumFractionDigits: 3,
    })} APT / min`;
  }

  streamRatePerSecond *= 60; // to hours
  if (Math.abs(streamRatePerSecond) >= 1) {
    return `${streamRatePerSecond.toLocaleString(undefined, {
      maximumFractionDigits: 3,
    })} APT / hr`;
  }

  streamRatePerSecond *= 24; // to days
  if (Math.abs(streamRatePerSecond) >= 1) {
    return `${streamRatePerSecond.toLocaleString(undefined, {
      maximumFractionDigits: 3,
    })} APT / day`;
  }

  streamRatePerSecond *= 7; // to weeks
  if (Math.abs(streamRatePerSecond) >= 1) {
    return `${streamRatePerSecond.toLocaleString(undefined, {
      maximumFractionDigits: 3,
    })} APT / week`;
  }

  streamRatePerSecond *= 4; // to months
  if (Math.abs(streamRatePerSecond) >= 1) {
    return `${streamRatePerSecond.toLocaleString(undefined, {
      maximumFractionDigits: 3,
    })} APT / month`;
  }

  streamRatePerSecond *= 12; // to years

  return `${streamRatePerSecond.toLocaleString(undefined, {
    maximumFractionDigits: 3,
  })} APT / year`;
}

export default function StreamRateIndicator() {
  // wallet adapter state
  const { isLoading, account, connected } = useWallet();
  // stream rate state
  const [streamRate, setStreamRate] = useState(0);

  const DEFAULT_APT = 100000000;

  /* 
    Calculates and sets the stream rate
  */
  useEffect(() => {
    calculateStreamRate().then((streamRate) => {
      setStreamRate(streamRate);
    });
  });

  /*
    Calculates the stream rate by adding up all of the streams the user is receiving and subtracting
    all of the streams the user is sending.
  */
  const calculateStreamRate = async () => {
    /* 
      TODO: #1: Fetch the receiver and sender streams using getReceiverStreams and getSenderStreams. 
            Then, calculate the stream rate by calculating and adding up the rate of APT per second 
            for each receiver stream and subtracting the rate of APT per second for each sender stream.
            Return the stream rate.
    */
    let aptPerSec = 0;
    let receiverStreams = await getReceiverStreams();
    let senderStreams = await getSenderStreams();

    receiverStreams.completed.forEach(
      (stream) => (aptPerSec += stream.amountAptFloat)
    );

    senderStreams.forEach((stream) => (aptPerSec -= stream.amountAptFloat));

    return aptPerSec;
  };

  const getSenderStreams = async (): Promise<Stream[]> => {
    /*
     TODO: #2: Validate the account is defined before continuing. If not, return.
   */
    if (!account) {
      return [];
    }

    /*
       TODO: #3: Make a request to the view function `get_senders_streams` to retrieve the streams sent by 
             the user.
    */
    const body = {
      function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::get_senders_streams`,
      type_arguments: [],
      arguments: [account.address],
    };

    let res;

    try {
      res = await fetch(`https://fullnode.testnet.aptoslabs.com/v1/view`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const [recipients, timestamps, durations, amounts, streamIds] =
        await res.json();
      /* 
       TODO: #4: Parse the response from the view request and create the streams array using the given 
             data. Return the new streams array. 
       HINT:
        - Remember to convert the amount to floating point number
    */
      const streams: Stream[] = [];
      recipients.forEach((recipient: string, index: number) => {
        const stream: Stream = {
          sender: account.address,
          recipient: recipient,
          amountAptFloat: parseFloat(amounts[index]) / DEFAULT_APT,
          durationMilliseconds: 1e3 * durations[index],
          startTimestampMilliseconds: 1e3 * timestamps[index],
          streamId: streamIds[index],
        };
        streams.push(stream);
      });

      return streams;

    } catch (e: any) {
      console.log("ERROR: " + e.message);
      return [];
    }
  };

  const getReceiverStreams = async (): Promise<{
    pending: Stream[];
    completed: Stream[];
    active: Stream[];
  }> => {
    /*
      TODO: #5: Validate the account is defined before continuing. If not, return.
    */
    if (!account) {
      return {
        pending: [],
        completed: [],
        active: [],
      };
    }

    /*
      TODO: #6: Make a request to the view function `get_receivers_streams` to retrieve the streams sent by 
            the user.
    */
    const body = {
      function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::get_receivers_streams`,
      type_arguments: [],
      arguments: [account.address],
    };

    let res;

    try {
      res = await fetch(`https://fullnode.testnet.aptoslabs.com/v1/view`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const [senders, timestamps, durations, amounts, streamIds] =
        await res.json();

      /* 
      TODO: #7: Parse the response from the view request and create an object containing an array of 
            pending, completed, and active streams using the given data. Return the new object.
      

      HINT:
        - Remember to convert the amount to floating point number
        - Remember to convert the timestamps to milliseconds
        - Mark a stream as pending if the start timestamp is 0
        - Mark a stream as completed if the start timestamp + duration is less than the current time
        - Mark a stream as active if it is not pending or completed
    */
      const pendingStreams: Stream[] = [];
      const completedStreams: Stream[] = [];
      const activeStreams: Stream[] = [];

      senders.forEach((sender: string, index: number) => {
        const stream: Stream = {
          sender: sender,
          recipient: account.address,
          amountAptFloat: parseFloat(amounts[index]) / 1e8,
          durationMilliseconds: 1e3 * durations[index],
          startTimestampMilliseconds: 1e3 * timestamps[index],
          streamId: streamIds[index],
        };

        if (stream.startTimestampMilliseconds === 0) {
          pendingStreams.push(stream);
        } else if (
          stream.startTimestampMilliseconds + stream.durationMilliseconds <
          Date.now()
        ) {
          completedStreams.push(stream);
        } else {
          activeStreams.push(stream);
        }
      });

      return {
        pending: pendingStreams,
        completed: completedStreams,
        active: activeStreams,
      };
    } catch (e: any) {
      console.log("ERROR: " + e.message);

      return {
        pending: [],
        completed: [],
        active: [],
      };
    }
  };

  if (!connected) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-neutral-500 hover:bg-neutral-500 px-3">
          <div className="flex flex-row gap-3 items-center">
            <InfoCircledIcon className="h-4 w-4 text-neutral-100" />

            <span
              className={
                "font-matter " +
                (streamRate > 0
                  ? "text-green-400"
                  : streamRate < 0
                  ? "text-red-400"
                  : "")
              }
            >
              {isLoading || !connected ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                displayStreamRate(streamRate)
              )}
            </span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your current stream rate</DialogTitle>
          <DialogDescription>
            This is the current rate at which you are streaming and being
            streamed APT. This rate is calculated by adding up all of the
            streams you are receiving and subtracting all of the streams you are
            sending.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
