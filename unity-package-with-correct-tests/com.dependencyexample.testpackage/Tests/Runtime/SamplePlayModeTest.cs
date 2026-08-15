using System.Collections;
using NUnit.Framework;
using UnityEngine.TestTools;

namespace Tests
{
  public class SamplePlayModeTest
  {
    // A Test behaves as an ordinary method
    [Test]
    public void NewTestScriptSimplePasses()
    {
      // Given
      var counter = new BasicCounter(0);

      // When
      counter.Increment();

      // Then
      Assert.AreEqual(1, counter.Count);
    }

    // A UnityTest behaves like a coroutine in Play Mode. In Edit Mode you can use
    // `yield return null;` to skip a frame.
    [UnityTest]
    public IEnumerator NewTestScriptWithEnumeratorPasses()
    {
      // Given
      var counter = new BasicCounter(3);

      // Use the Assert class to test conditions.
      // Use yield to skip a frame.
      yield return null;

      // When
      counter.Increment();

      // Then
      Assert.AreEqual(4, counter.Count);
    }
  }
}
