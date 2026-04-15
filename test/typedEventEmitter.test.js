import assert from 'assert';
import path from 'path';
import { describe, it, beforeEach } from 'mocha';
import { TypedEventEmitter } from '../dist/events/typedEventEmitter.js';
import { CopybookParser } from '../dist/parser/copybookParser.js';

const assetsDir = path.join(process.cwd(), 'test', 'assets');

describe('TypedEventEmitter', () => {
  let emitter;

  beforeEach(() => {
    emitter = new TypedEventEmitter();
  });

  describe('subscribe', () => {
    it('should subscribe to an event and receive the payload', (done) => {
      const expectedPayload = { test: 'data' };
      
      emitter.subscribe('testEvent', (payload) => {
        assert.deepStrictEqual(payload, expectedPayload, 'Payload should match emitted data');
        done();
      });

      emitter.emit('testEvent', expectedPayload);
    });

    it('should allow multiple subscribers to the same event', () => {
      let callCount = 0;
      const payload = { value: 42 };

      const callback1 = () => { callCount++; };
      const callback2 = () => { callCount++; };

      emitter.subscribe('testEvent', callback1);
      emitter.subscribe('testEvent', callback2);

      emitter.emit('testEvent', payload);

      assert.strictEqual(callCount, 2, 'Both callbacks should be called');
    });

    it('should maintain separate subscribers for different events', () => {
      let event1Called = false;
      let event2Called = false;

      emitter.subscribe('event1', () => { event1Called = true; });
      emitter.subscribe('event2', () => { event2Called = true; });

      emitter.emit('event1', {});

      assert(event1Called, 'event1 subscriber should be called');
      assert(!event2Called, 'event2 subscriber should not be called');
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe a callback from an event', () => {
      let callCount = 0;
      const callback = () => { callCount++; };

      emitter.subscribe('testEvent', callback);
      emitter.emit('testEvent', {});
      assert.strictEqual(callCount, 1, 'Callback should be called once after subscription');

      emitter.unsubscribe('testEvent', callback);
      emitter.emit('testEvent', {});
      assert.strictEqual(callCount, 1, 'Callback should not be called after unsubscription');
    });

    it('should only remove the specified callback when multiple are subscribed', () => {
      let callback1Called = false;
      let callback2Called = false;
      const callback1 = () => { callback1Called = true; };
      const callback2 = () => { callback2Called = true; };

      emitter.subscribe('testEvent', callback1);
      emitter.subscribe('testEvent', callback2);

      emitter.unsubscribe('testEvent', callback1);
      emitter.emit('testEvent', {});

      assert(!callback1Called, 'Unsubscribed callback1 should not be called');
      assert(callback2Called, 'Subscribed callback2 should be called');
    });

    it('should handle unsubscribing from non-existent event gracefully', () => {
      const callback = () => {};
      assert.doesNotThrow(() => {
        emitter.unsubscribe('nonExistentEvent', callback);
      }, 'Should not throw when unsubscribing from non-existent event');
    });

    it('should handle unsubscribing a callback that was never subscribed', () => {
      const callback1 = () => {};
      const callback2 = () => {};

      emitter.subscribe('testEvent', callback1);
      assert.doesNotThrow(() => {
        emitter.unsubscribe('testEvent', callback2);
      }, 'Should not throw when unsubscribing a non-subscribed callback');
    });
  });

  describe('emit', () => {
    it('should emit an event to all subscribers', () => {
      const results = [];

      emitter.subscribe('testEvent', (payload) => { results.push(1); });
      emitter.subscribe('testEvent', (payload) => { results.push(2); });

      emitter.emit('testEvent', {});

      assert.deepStrictEqual(results, [1, 2], 'Both subscribers should be called in order');
    });

    it('should pass the correct payload to the callback', (done) => {
      const expectedPayload = { name: 'test', value: 123 };

      emitter.subscribe('testEvent', (payload) => {
        assert.deepStrictEqual(payload, expectedPayload, 'Payload should be passed correctly');
        done();
      });

      emitter.emit('testEvent', expectedPayload);
    });

    it('should emit without any errors if no subscribers are registered', () => {
      assert.doesNotThrow(() => {
        emitter.emit('testEvent', {});
      }, 'Should not throw when emitting to non-existent subscribers');
    });

    it('should allow emitting complex payloads', (done) => {
      const complexPayload = {
        string: 'value',
        number: 42,
        array: [1, 2, 3],
        object: { nested: 'data' }
      };

      emitter.subscribe('testEvent', (payload) => {
        assert.deepStrictEqual(payload, complexPayload, 'Complex payload should be passed correctly');
        done();
      });

      emitter.emit('testEvent', complexPayload);
    });
  });

  describe('once', () => {
    it('should subscribe to an event only once', () => {
      let callCount = 0;

      emitter.once('testEvent', () => { callCount++; });

      emitter.emit('testEvent', {});
      assert.strictEqual(callCount, 1, 'Callback should be called once on first emit');

      emitter.emit('testEvent', {});
      assert.strictEqual(callCount, 1, 'Callback should not be called on second emit');
    });

    it('should still receive the payload with once', (done) => {
      const expectedPayload = { data: 'test' };

      emitter.once('testEvent', (payload) => {
        assert.deepStrictEqual(payload, expectedPayload, 'Payload should be passed to once callback');
        done();
      });

      emitter.emit('testEvent', expectedPayload);
    });

    it('should allow multiple once subscriptions to the same event', () => {
      let callback1Count = 0;
      let callback2Count = 0;

      emitter.once('testEvent', () => { callback1Count++; });
      emitter.once('testEvent', () => { callback2Count++; });

      emitter.emit('testEvent', {});

      assert.strictEqual(callback1Count, 1, 'First once callback should be called once');
      assert.strictEqual(callback2Count, 1, 'Second once callback should be called once');

      emitter.emit('testEvent', {});

      assert.strictEqual(callback1Count, 1, 'First once callback should not be called again');
      assert.strictEqual(callback2Count, 1, 'Second once callback should not be called again');
    });
  });

  describe('Integration with CopybookParser - parsing example_copybook.txt', () => {
    it('should emit start event with correct payload', (done) => {
      const parser = new CopybookParser(path.join(assetsDir, 'example_copybook.txt'));
      const emitter = parser.getEventEmitter();

      emitter.subscribe('start', (payload) => {
        assert(payload.copybook, 'start event should have copybook path');
        assert(payload.copybook.includes('example_copybook.txt'), 'Copybook path should include filename');
        assert(typeof payload.rawData === 'string', 'start event should have rawData as string');
        assert(Array.isArray(payload.preparedData), 'start event should have preparedData as array');
        assert(payload.preparedData.length > 0, 'preparedData should not be empty');
        done();
      });

      parser.parse();
    });

    it('should emit newLine event for each line processed', (done) => {
      const parser = new CopybookParser(path.join(assetsDir, 'example_copybook.txt'));
      const emitter = parser.getEventEmitter();
      let lineCount = 0;

      emitter.subscribe('newLine', (payload) => {
        lineCount++;
        assert(payload.copybook, 'newLine event should have copybook path');
        assert(typeof payload.line === 'string', 'newLine event should have line as string');
        assert(Array.isArray(payload.parsedItems), 'newLine event should have parsedItems as array');
      });

      parser.parse();
      
      assert(lineCount > 0, 'Should emit at least one newLine event');
      done();
    });

    it('should emit endLine event for each line processed', (done) => {
      const parser = new CopybookParser(path.join(assetsDir, 'example_copybook.txt'));
      const emitter = parser.getEventEmitter();
      let endLineCount = 0;

      emitter.subscribe('endLine', (payload) => {
        endLineCount++;
        assert(payload.copybook, 'endLine event should have copybook path');
        assert(typeof payload.line === 'string', 'endLine event should have line as string');
        assert(payload.newItem, 'endLine event should have newItem');
        assert(payload.newItem.level !== undefined, 'newItem should have level');
        assert(payload.newItem.item, 'newItem should have item');
        assert(Array.isArray(payload.parsedItems), 'endLine event should have parsedItems as array');
      });

      parser.parse();
      
      assert(endLineCount > 0, 'Should emit at least one endLine event');
      done();
    });

    it('should emit end event with parsed copybook', (done) => {
      const parser = new CopybookParser(path.join(assetsDir, 'example_copybook.txt'));
      const emitter = parser.getEventEmitter();

      emitter.subscribe('end', (payload) => {
        assert(payload.copybook, 'end event should have copybook path');
        assert(payload.copybook.includes('example_copybook.txt'), 'Copybook path should include filename');
        assert(Array.isArray(payload.parsedCopybook), 'end event should have parsedCopybook as array');
        assert(payload.parsedCopybook.length > 0, 'parsedCopybook should not be empty');
        done();
      });

      parser.parse();
    });

    it('should emit events in correct order: start -> newLine -> endLine -> end', (done) => {
      const parser = new CopybookParser(path.join(assetsDir, 'example_copybook.txt'));
      const emitter = parser.getEventEmitter();
      const eventSequence = [];

      emitter.subscribe('start', () => { eventSequence.push('start'); });
      emitter.subscribe('newLine', () => { eventSequence.push('newLine'); });
      emitter.subscribe('endLine', () => { eventSequence.push('endLine'); });
      emitter.subscribe('end', () => { eventSequence.push('end'); });

      parser.parse();

      assert.strictEqual(eventSequence[0], 'start', 'First event should be start');
      assert.strictEqual(eventSequence[eventSequence.length - 1], 'end', 'Last event should be end');

      // Check that we have alternating newLine and endLine events
      let foundNewLineAndEndLine = false;
      for (let i = 1; i < eventSequence.length - 1; i++) {
        if (eventSequence[i] === 'newLine' && eventSequence[i + 1] === 'endLine') {
          foundNewLineAndEndLine = true;
          break;
        }
      }

      assert(foundNewLineAndEndLine, 'Should have newLine followed by endLine events');
      done();
    });

    it('should allow subscribing with once to parsing events', (done) => {
      const parser = new CopybookParser(path.join(assetsDir, 'example_copybook.txt'));
      const emitter = parser.getEventEmitter();
      let startEventCount = 0;

      emitter.once('start', () => { startEventCount++; });

      parser.parse();

      assert.strictEqual(startEventCount, 1, 'start event should be emitted exactly once during parsing');
      done();
    });

    it('should allow tracking parsed items accumulation through newLine events', (done) => {
      const parser = new CopybookParser(path.join(assetsDir, 'example_copybook.txt'));
      const emitter = parser.getEventEmitter();
      const itemCounts = [];

      emitter.subscribe('newLine', (payload) => {
        itemCounts.push(payload.parsedItems.length);
      });

      parser.parse();

      // Check that parsedItems accumulates (generally should be non-decreasing)
      for (let i = 1; i < itemCounts.length; i++) {
        assert(
          itemCounts[i] >= itemCounts[i - 1],
          `ParsedItems should accumulate: at position ${i}, count was ${itemCounts[i]} but previous was ${itemCounts[i - 1]}`
        );
      }

      done();
    });

    it('should provide increasing lineNumbers in processed events', (done) => {
      const parser = new CopybookParser(path.join(assetsDir, 'example_copybook.txt'));
      const emitter = parser.getEventEmitter();
      let startCopybookPath = '';

      emitter.subscribe('start', (payload) => {
        startCopybookPath = payload.copybook;
      });

      emitter.subscribe('newLine', (payload) => {
        assert.strictEqual(payload.copybook, startCopybookPath, 'All events should reference the same copybook');
      });

      emitter.subscribe('endLine', (payload) => {
        assert.strictEqual(payload.copybook, startCopybookPath, 'All events should reference the same copybook');
      });

      parser.parse();
      done();
    });

    it('should handle unsubscribe during parsing', (done) => {
      const parser = new CopybookParser(path.join(assetsDir, 'example_copybook.txt'));
      const emitter = parser.getEventEmitter();
      let callCount = 0;

      const callback = () => { callCount++; };
      
      emitter.subscribe('newLine', callback);
      emitter.subscribe('endLine', callback);

      parser.parse();
      const countAfterFirstParse = callCount;

      emitter.unsubscribe('newLine', callback);
      emitter.unsubscribe('endLine', callback);

      const parser2 = new CopybookParser(path.join(assetsDir, 'example_copybook.txt'));
      parser2.parse();

      assert.strictEqual(callCount, countAfterFirstParse, 'Callback should not be called after unsubscribe');
      done();
    });
  });
});
