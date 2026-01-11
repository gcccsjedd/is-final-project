import threading
import time
import random
from concurrent.futures import ThreadPoolExecutor

 

def say_hello(thread_id):
    print(f"Hello from Thread {thread_id}")

threads = []
for i in range(20):
    t = threading.Thread(target=say_hello, args=(i,))
    threads.append(t)
    t.start()

def delayed_hello(thread_id):
    time_to_sleep = random.randint(1, 3)
    time.sleep(time_to_sleep)
    print(f"Hello from Thread {thread_id} after {time_to_sleep} seconds")

threads = []
for i in range(5):
    t = threading.Thread(target=delayed_hello, args=(i,))
    threads.append(t)
    t.start()

for t in threads:
    t.join()

print("All threads are done!")

counter = 0

def increment():
    global counter
    for _ in range(1000):
        counter += 1

threads = []
for _ in range(10):
    t = threading.Thread(target=increment)
    threads.append(t)
    t.start()

for t in threads:
    t.join()

print("Final counter value (Race Condition):", counter)

counter = 0
lock = threading.Lock()

def safe_increment():
    global counter
    for _ in range(1000):
        with lock:
            counter += 1

threads = []
for _ in range(10):
    t = threading.Thread(target=safe_increment)
    threads.append(t)
    t.start()

for t in threads:
    t.join()

print("Final counter value with Lock:", counter)

def background_task():
    while True:
        print("Daemon thread running...")
        time.sleep(1)

daemon = threading.Thread(target=background_task)
daemon.daemon = True
daemon.start()

time.sleep(5)
print("Main program exiting...")

def do_task(task_id):
    print(f"Task {task_id} done by thread {threading.current_thread().name}")

with ThreadPoolExecutor(max_workers=5) as executor:
    for i in range(5):
        executor.submit(do_task, i)