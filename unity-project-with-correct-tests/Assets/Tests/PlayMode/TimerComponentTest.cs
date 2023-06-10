using System.Collections;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;

namespace Tests
{
  public class TimerComponentTest
  {
    private GameObject target;
    private TimerComponent component;

    [SetUp]
    public void Setup()
    {
      target = GameObject.Instantiate(new GameObject());
      component = target.AddComponent<TimerComponent>();
    }

    [UnityTest]
    public IEnumerator TestIncrementAfterSomeTime()
    {
      // Save the current value, since it was updated after component Start() method called
      var count = component.Counter.Count;

      // Skip frame and assert the new value
      yield return null;
      Assert.AreEqual(count, component.Counter.Count);

      yield return new WaitForSeconds(1.1f);
      Assert.AreEqual(count + 1, component.Counter.Count);

      yield return new WaitForSeconds(1.1f);
      Assert.AreEqual(count + 2, component.Counter.Count);
    }

    [UnityTest]
    public IEnumerator TestTimeScaleIsAffectingIncrement()
    {
      // Save the current value, since it was updated after component Start() method called
      var count = component.Counter.Count;
      Time.timeScale = .5f;

      // Skip frame and assert the new value
      yield return null;
      Assert.AreEqual(count, component.Counter.Count);

      yield return WaitForRealSeconds(1.1f);
      Assert.AreEqual(count, component.Counter.Count);

      yield return WaitForRealSeconds(1.1f);
      Assert.AreEqual(count + 1, component.Counter.Count);
    }

    // Skipping time ignoring Time.scale
    // https://answers.unity.com/questions/301868/yield-waitforseconds-outside-of-timescale.html
    public static IEnumerator WaitForRealSeconds(float time)
    {
      float start = Time.realtimeSinceStartup;
      while (Time.realtimeSinceStartup < start + time)
      {
        yield return null;
      }
    }
  }
}
