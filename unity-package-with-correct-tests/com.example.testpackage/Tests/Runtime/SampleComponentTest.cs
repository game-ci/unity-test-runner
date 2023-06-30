using System.Collections;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;

namespace Tests
{
  public class SampleComponentTest
  {
    private GameObject target;
    private SampleComponent component;

    [SetUp]
    public void Setup()
    {
      target = GameObject.Instantiate(new GameObject());
      component = target.AddComponent<SampleComponent>();
    }

    [UnityTest]
    public IEnumerator TestIncrementOnUpdateAfterNextFrame()
    {
      // Save the current value, since it was updated after component Start() method called
      var count = component.Counter.Count;

      // Skip frame and assert the new value
      yield return null;
      Assert.AreEqual(count + 1, component.Counter.Count);
    }
  }
}
